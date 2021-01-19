package types

// PubmedQuery is the expexted input format for this entrypoint.
type PubmedQuery struct {
	PubMedID  []string `json:"pmids"`
	Site      string   `json:"site"`
	Stage     string   `json:"stage"`
	MaxQuery  int      `json:"max"`
	SkipCites bool     `json:"skip_cites"`
	Forced    bool     `json:"forced"`
}

// PubmedData is the primary data structure in the pubmedQueries module,
// maps between backend database, model, and extracted data from pubmed API.
type PubmedData struct {
	Title    []string `json:"title"`
	Date     string   `json:"date"`
	Abstract []string `json:"abstract"`
	Authors  []string `json:"authors"`
	PubMedID string   `json:"pmid"`
	DOI      string   `json:"doi"`
	CitedBy  []string `json:"cited_by"`
	Cites    []string `json:"cites"`
	Rank     int      `json:"rank"`
	Keywords []string `json:"keywords"`
}

// CiteNode maps to the output of BuildCitationGraphNode.py.
type CiteNode struct {
	Cites   []string `json:"cites"`
	CitedBy []string `json:"cited_by"`
}

// This struct should include all fields needed to select some collection of
// data for the model. Site + Stage seems like what would be required,
// but I am not sure how the data is being modeled. Whatever is required
// to select all papers from the database in a specific domain should
// be included here
type DataSelector struct {
	Site  string `json:"site"`
	Stage string `json:"stage"`
}

type SearchResponse struct {
	ESearchResult KeywordSearch `json:"esearchresult"`
}

type KeywordSearch struct {
	PMIDs []string `json:"idlist"`
}
