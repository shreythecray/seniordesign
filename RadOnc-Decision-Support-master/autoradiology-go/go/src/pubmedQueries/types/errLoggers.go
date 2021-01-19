package types

import (
	"log"
	"os"
)

var PubmedLogger *log.Logger

func init() {
	f, _ := os.OpenFile("pubmedQueryErr.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	PubmedLogger = log.New(f, "pubmedQuery", log.LstdFlags)
}
