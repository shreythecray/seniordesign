package entrypoints

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"pubmedQueries/dbAccess"
	"pubmedQueries/goPython"
	. "pubmedQueries/types"
	"sort"
	"strconv"
	"strings"
)

/*
   RunModel receives a DataSelector post request and runs the
   model in python/comparePapers. RunModel updates the database
   with recommendations, and can trigger a call to GetPaperData
   when the model does not return the desired amount of papers.
   Returning less then the number of papers requested is the model's
   signal that it requires more new papers to make quality
   recommendations.
*/
func RunModel(w http.ResponseWriter, r *http.Request) {
	fmt.Println("running model")
	jsn, err := ioutil.ReadAll(r.Body)
	if err != nil {
		PubmedLogger.Printf("Error reading body: ", err)
	}

	ds := DataSelector{}
	err = json.Unmarshal(jsn, &ds)
	if err != nil {
		PubmedLogger.Printf("Decoding error: ", err)
	}

	Running[ds] = true

	pmids := dbaccess.SelectData(ds)
	var dataString []byte
	for _, pmid := range pmids {
		dat, _ := json.Marshal(pmid)
		dataString = append(dataString[:], dat...)
		dataString = append(dataString[:], '\n')
	}

	command := "/app/python/comparePapers/paperModel.py"
	arg1 := 100
	arg2 := "0.1"

	out, _ := gopy.RunPython(dataString, command, strconv.Itoa(arg1), arg2)
	pmidsRanked := strings.Split(string(out), "\n")
	pmidsRanked = pmidsRanked[:len(pmidsRanked)-1]
	dbaccess.WriteRecs(pmidsRanked, ds)

	//fmt.Printf(string(out))
	fmt.Printf("pmidsRanked: %s\n", pmidsRanked)

	//fmt.Printf(string(out))
	fmt.Printf("pmidsRanked: %s\n", pmidsRanked)

	// Check if model needs more papers
	if len(pmidsRanked) < arg1 {
		// Reads in pubmed data for some site and stage with a known rating
		// of at least 1
		fmt.Printf("GETTING PAPERS:")
		pmd := dbaccess.ReadPmd(ds.Site, ds.Stage, 1)
		// Get the 50 highest rated papers from the sit-stage.
		topPmids := getHighestRankedPMD(pmd, 50)
		getMorePapers(ds.Site, ds.Stage, topPmids)
	}

	Running[ds] = false
}

func getMorePapers(site string, stage string, pmids []string) {
	fmt.Println("getting papers")
	var pmq PubmedQuery
	pmq.Site = site
	pmq.Stage = stage
	pmq.MaxQuery = 1000
	pmq.PubMedID = pmids
	pr, err := json.Marshal(pmq)
	if err != nil {
		PubmedLogger.Printf("Encode error: ", err)
	}

	url := "http://0.0.0.0:8088/get-paper-data"
	_, err = http.Post(url, "application/json", bytes.NewBuffer(pr))
	if err != nil {
		PubmedLogger.Printf("Request error: ", err)
	}
}

func getHighestRankedPMD(pmd []PubmedData, size int) []string {
	var sortedPmd []PubmedData
	if len(pmd) > size {
		sort.Slice(pmd[:], func(i, j int) bool {
			return pmd[i].Rank < pmd[j].Rank
		})
	} else {
		size = len(pmd)
		sortedPmd = pmd
	}

	var pmids []string
	for i := 0; i < size; i++ {
		pmids = append(pmids, sortedPmd[i].PubMedID)
	}
	return pmids
}
