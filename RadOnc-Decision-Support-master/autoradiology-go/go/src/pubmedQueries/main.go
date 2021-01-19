package main

import (
	"fmt"
	"net/http"
	"pubmedQueries/entrypoints"
)

func server() {
	http.HandleFunc("/get-paper-data", entrypoints.GetPaperData)
	http.HandleFunc("/get-id", entrypoints.QueryID)
	http.HandleFunc("/run-model", entrypoints.RunModel)
	http.HandleFunc("/update-paper-data", entrypoints.UpdateAllPapers)
	http.HandleFunc("/query-running", entrypoints.QueryRunning)
	fmt.Println(http.ListenAndServe(":8088", nil))
}

func main() {
	server()
}
