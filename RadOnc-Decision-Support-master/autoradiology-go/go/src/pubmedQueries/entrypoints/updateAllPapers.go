package entrypoints

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"pubmedQueries/dbAccess"
	. "pubmedQueries/types"
)

/*
	UpdateAllPapers is used to re-query all papers in the database.
	The primary use case is if an additional data field is added to
	paper data, requiring all papers to pull data for this new field.
	Function bypasses the standard behavior of GetPaperData which
	will load paper data from the database rather then making a query
	if a paper is already stored locally.

	Receives a DataSelector post request and updates all papers in the
	site-stage specified by the DataSelector.
*/
func UpdateAllPapers(w http.ResponseWriter, r *http.Request) {
	jsn, err := ioutil.ReadAll(r.Body)
	if err != nil {
		PubmedLogger.Printf("Error reading body: ", err)
	}

	ds := DataSelector{}
	err = json.Unmarshal(jsn, &ds)
	if err != nil {
		PubmedLogger.Printf("Decoding error: ", err)
	}

	pmids := dbaccess.GetAllPubmedID(ds.Site, ds.Stage)
	getPapers(ds.Site, ds.Stage, pmids)

	data := dbaccess.SelectData(ds)
	data_jsn, _ := json.Marshal(data)
	w.Write(data_jsn)
}

func getPapers(site string, stage string, pmids []string) {
	var pmq PubmedQuery
	pmq.Site = site
	pmq.Stage = stage
	pmq.MaxQuery = len(pmids)
	pmq.PubMedID = pmids
	pmq.SkipCites = true
	pmq.Forced = true
	pr, err := json.Marshal(pmq)
	if err != nil {
		PubmedLogger.Printf("Encode error: ", err)
	}

	url := "http://0.0.0.0:8088/get-paper-data"
	out, err := http.Post(url, "application/json", bytes.NewBuffer(pr))
	if err != nil {
		PubmedLogger.Printf("Request error: ", err)
	}
	fmt.Printf("%+v\n", out)
}
