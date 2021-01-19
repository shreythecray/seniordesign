package entrypoints

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

// Expected interface of input request
type paperID struct {
	DOI  string `json:"doi"`
	PMID string `json:"pmid"`
}

// Response interface from pubmed API
type pubmedIDResponse struct {
	Status       string   `json:"status"`
	ResponseDate string   `json:"responseDate"`
	Request      string   `json:"request"`
	Records      []record `json:"records"`
}

type record struct {
	PMID  string `json:"pmid"`
	PMCID string `json:"pmcid"`
	DOI   string `json:"doi"`
}

/*
	Receives a json post request in the form {doi: <string>, pmid: <string>}
	where one field should be empty. Service uses a pubmed api to fill in the
	other field.
*/
func QueryID(w http.ResponseWriter, r *http.Request) {

	jsn, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Fatal("Error reading body: ", err)
	}

	id := paperID{}
	err = json.Unmarshal(jsn, &id)
	if err != nil {
		log.Fatal("Decoding error 1: ", err)
	}

	tool := "ucdavis_ecs193_autooncology"
	email := "spreichelt@ucdavis.edu"
	base := "https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?format=json&"

	var url string
	if id.DOI != "" && id.PMID != "" {
		/*
			Function could simply exit here. This request did not match the
			expected input form.
		*/
		return
	} else if id.DOI != "" {
		url = fmt.Sprintf("%stool=%s&email=%s.com&ids=%s", base, tool, email, id.DOI)
	} else if id.PMID != "" {
		url = fmt.Sprintf("%stool=%s&email=%s.com&ids=%s", base, tool, email, id.PMID)
	} else {
		log.Fatal("Request error: No id received", id)
	}

	response, err := http.Get(url)
	if err != nil {
		log.Fatal("Request error: ", err)
	}

	jsn, err = ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatal("Decode error 2: ", err)
	}

	pid := pubmedIDResponse{}
	err = json.Unmarshal(jsn, &pid)
	if err != nil {
		log.Fatal("Decode error 3: ", err)
	}

	/*
		TODO: Update database with the missing information.
		Notes:
			1. A nil PMID is possible if a provided doi is not on pubmed
			2. A nil doi is possible if the provided PMID is malformed, or
				does not map to a paper with a doi (have seen this occur)
			3. This entrypoint handles both types of request, it is possible
				to determine the initial request type using the @id variable
			4. This function could return a response to the caller using the
				same json format it received.
	*/
	//	out, err := fmt.Printf("DOI: %s, PMID: %s\n\n", pid.Records[0].DOI, pid.Records[0].PMID)
	rec := record{}
	if len(pid.Records) > 0 {
		rec.PMID = pid.Records[0].PMID
		rec.DOI = pid.Records[0].DOI
	}
	tmp, err := json.Marshal(rec)
	w.Write(tmp)
}
