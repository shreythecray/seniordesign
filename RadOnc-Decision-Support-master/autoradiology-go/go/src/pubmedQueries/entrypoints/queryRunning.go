package entrypoints

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	. "pubmedQueries/types"
)

var Running = make(map[DataSelector]bool)

/*
	QueryRunning is used to determine if a certain site-stage
	is already being used by RunModel. The front end checks this
	API before sending a request to RunModel that a user
	initiates using a button. If the model is already running it
	should not be queried again.
*/
func QueryRunning(w http.ResponseWriter, r *http.Request) {

	jsn, err := ioutil.ReadAll(r.Body)
	if err != nil {
		PubmedLogger.Printf("Error reading body: ", err)
	}

	ds := DataSelector{}
	err = json.Unmarshal(jsn, &ds)
	if err != nil {
		PubmedLogger.Printf("Decoding error: ", err)
	}

	if Running[ds] {
		w.Write([]byte("true"))
	} else {
		w.Write([]byte("false"))
	}

}
