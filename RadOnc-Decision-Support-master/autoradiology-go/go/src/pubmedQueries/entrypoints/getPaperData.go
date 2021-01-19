package entrypoints

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"pubmedQueries/dbAccess"
	"pubmedQueries/goPython"
	. "pubmedQueries/types"
	"sync"
	"time"
)

const CMD_PD string = "/app/python/pubmedQueries/GetPaperData.py"
const CMD_N string = "/app/python/pubmedQueries/BuildCitationGraphNode.py"

var pmidQMutex sync.Mutex
var apiKeyMutex sync.Mutex

func updateQueue(pmids_q []string, pmids ...string) []string {
	pmidQMutex.Lock()
	defer pmidQMutex.Unlock()
	pmids_q = append(pmids_q, pmids...) // Add to the pmids queue.

	return pmids_q
}

/*
	GetPaperData receives a PubmedQuery post request and writes 
	PaperData objects to the database according to parameters
	specified in the PubmedQuery.
*/
func GetPaperData(w http.ResponseWriter, r *http.Request) {
	// Read input JSON request.
	jsn, err := ioutil.ReadAll(r.Body)
	if err != nil {
		PubmedLogger.Printf("Error reading body: ", err)
	}

	// Convert input request to PubmedQuery object.
	pmq := PubmedQuery{}
	err = json.Unmarshal(jsn, &pmq)
	if err != nil {
		PubmedLogger.Printf("Decoding error: ", err)
	}

	// Start a queue of pmids, implemented as an array of string and initialized
	// with input arguement pmid.
	var pmids []string
	pmids = pmq.PubMedID

	// The pmd array is the ultimate return value of this function.
	var pmd []PubmedData

	// Open a channel goroutines can write PubmedData objects to.
	pmdC := make(chan PubmedData)

	// Count will track how many active threads are blocked writing to the pmdC.
	// The main thread collects these only when it has to, allowing an unbounded
	// number of threads to block on this channel.
	count := 0

	// Function to read from the pmdC and write data to required locations.
	readData := func() {
		data := <-pmdC
		pmids = updateQueue(pmids, append(data.Cites, data.CitedBy...)...)

		if len(data.Abstract) > 10 {
			if data.DOI == "" && data.PubMedID != "" {
				data.DOI = fmt.Sprintf("https://www.ncbi.nlm.nih.gov/pubmed/?term=%s", data.PubMedID)
			}
			dbaccess.WritePubmedData(data, pmq)
			pmd = append(pmd, data) // Write entire objects to output.
		}
	}

	// Pubmed API allows for 10 requests per second, throttle ensures that
	// at most 5 requests per second are initially attempted. Requests will
	// attempt to recover if they receive an error response by sending
	// up to ten additional requests.
	rate := time.Second / 5
	throttle := time.Tick(rate)

	// Semaphore used to ensure that at most 5 goroutines are able to attempt
	// requests on the Pubmed API.
	sem := make(chan int, 5)

	apiKeyMutex.Lock()
	defer apiKeyMutex.Unlock()
	for i := 0; i < pmq.MaxQuery; i++ {
		PubmedLogger.Printf("IN LOOP: %d < %d", i, pmq.MaxQuery)
		// If the pmids queue is empty, attempt to expand it using data on
		// the pmdC channel. If no threads are active, break to avoid a deadlock.
		if len(pmids) == 0 {
			if count == 0 {
				break
			}
			readData()
			i--
			count--
			continue
		}

		// Dequeue from the from of the queue
		pmid := pmids[0]
		pmids = pmids[1:]

		// Check if paper already exists
		inDB, err := dbaccess.IsPaperInDB(pmid)
		if !inDB || pmq.Forced {
			// Aquire a resource from the semaphore.
			sem <- 1
			go getSinglePaper(pmid, pmdC, throttle, sem, pmq)
			count++
		} else if err != nil {
			PubmedLogger.Printf("Error in db: ", err)
		} else {
			node := dbaccess.GetCiteNode(pmid)
			dat := dbaccess.GetPMD(pmq.Site, pmq.Stage, pmid)
			if dat.Rank > 8 {
				tmp := []PubmedData{dat}
				keyPmids := keywordSearch(tmp)
				pmids = updateQueue(pmids, keyPmids...)
			}
			pmids = updateQueue(pmids, append(node.Cites, node.CitedBy...)...)
			i--
		}
	}

	// Read any remaining data on the pmdC channel.
	for i := 0; i < count; i++ {
		readData()
	}

	// Write data as a json string response to the request.
	out, err := json.Marshal(pmd)
	if err != nil {
		PubmedLogger.Printf("Encoding error: ", err)
	}

	w.Write(out)
}

func keywordSearch(pmd []PubmedData) []string {
	// Required pieces for api query url
	base := "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?"
	db := "db=pubmed"
	tool := "&tool=ucdavis_ecs193_autooncology"
	email := "&email=spreichelt@ucdavis.edu"
	api_key := "&api_key=5847230ac6a594b91a82278abb3e96420a08"

	// Make a set of all keywords, union of keywords in every pmd object
	keywordSet := make(map[string]bool)

	for _, dat := range pmd {
		for _, word := range dat.Keywords {
			keywordSet[word] = true
		}
	}

	// Build query terms
	var keywords string
	sep := "[mesh]" + "+" + "AND" + "+"
	for word := range keywordSet {
		keywords += word + sep
	}

	// Add publication date cutoff to terms, query will require papers
	// to be published in 2018+
	terms := "&term=" + keywords + "2018" + "[pdat]"

	// Compile the url
	url := base + db + "&" + terms + "&retmode=json" + tool + email + api_key

	// Make request
	response, err := http.Get(url)
	if err != nil {
		PubmedLogger.Printf("Request error: ", err)
	}

	// Parse response
	r := SearchResponse{}
	jsn, err := ioutil.ReadAll(response.Body)
	if err != nil {
		PubmedLogger.Printf("Error reading body: ", err)
	}
	err = json.Unmarshal(jsn, &r)

	return r.ESearchResult.PMIDs
}

func getSinglePaper(pmid string, pmdC chan PubmedData, t <-chan time.Time, s chan int, pmq PubmedQuery) {
	// Block on the throttle channel until a tick is read by this thread.
	<-t

	// Call the GetPaperData.py function with the provided pmid.
	out1, _ := gopy.RunPython(nil, CMD_PD, pmid)

	// Convert the JSON output of GetPaperData.py to a PubmedData object.
	var pmd PubmedData
	err := json.Unmarshal(out1, &pmd)
	if err != nil {
		PubmedLogger.Printf("Decoding error: ", err)
	}

	// Block on the throttle channel until a tick is read by this thread
	if !pmq.SkipCites {
		<-t

		// Call the BuildCitationGraphNode.py function.
		out2, _ := gopy.RunPython(nil, CMD_N, pmid)

		// Convert JSON output of BuildCitationGraphNode.py to CiteNode object.
		var cites CiteNode
		err = json.Unmarshal(out2, &cites)
		if err != nil {
			PubmedLogger.Printf("Decoding error: ", err)
		}

		// Merge the CiteNote and PubmedData objects.
		pmd.CitedBy = cites.CitedBy
		pmd.Cites = cites.Cites
	} else {
		inDb, _ := dbaccess.IsPaperInDB(pmid)
		if inDb {
			node := dbaccess.GetCiteNode(pmid)
			pmd.CitedBy = node.CitedBy
			pmd.Cites = node.Cites
		}

	}

	// Release a resource to the semaphore.
	<-s

	fmt.Println(pmid)
	// fmt.Printf("%+v\n", pmd)

	// Write data to channel.
	pmdC <- pmd
}
