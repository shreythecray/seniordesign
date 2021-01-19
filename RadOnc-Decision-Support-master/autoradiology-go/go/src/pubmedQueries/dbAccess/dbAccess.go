package dbaccess

import (
	"database/sql"
	"encoding/json"
	"fmt"
	_ "github.com/lib/pq"
	. "pubmedQueries/types"
	"strconv"
	"strings"
)

/*
	Initialize database access as a global singleton.
*/
var db *sql.DB

func init() {
	connStr := "user=postgres dbname=postgres host=autorad-db sslmode=disable"
	db, _ = sql.Open("postgres", connStr)
	db.SetMaxOpenConns(70)
	db.SetMaxIdleConns(70)
}

/*
	GetAllPubmedID receives a site and stage and returns all
	pmids associated to those parameters.
*/
func GetAllPubmedID(site string, stage string) []string {

	var pmids []string
	var sqlStmt = `
	SELECT pmid
	FROM papers2
	WHERE site_stage_id = (
		SELECT id
		FROM site_stage
		WHERE site = $1
		AND stage = $2
	)
	`
	rows, err := db.Query(sqlStmt, site, stage)
	if err != nil {
		PubmedLogger.Printf("Error in GetAllPubmedID db.Query: ", err)
		return pmids
	}

	// Need to close the rows object when done, do not close rows in loops.
	defer rows.Close()
	for rows.Next() {
		var pmid string
		err = rows.Scan(&pmid)
		if err != nil {
			PubmedLogger.Printf("Error in GetAllPubmedID rows.Scan: ", err)
			continue
		}
		pmids = append(pmids, pmid)
	}

	// get any error encountered during iteration
	err = rows.Err()
	if err != nil {
		PubmedLogger.Printf("Error in GetAllPubmedID rows.Err: ", err)
	}
	return pmids
}

/*
	WritePubmedData receives a single PubmedData object and a PubmedQuery
	object that specifies where the paper should be written (site and stage).
*/
func WritePubmedData(paper PubmedData, pmq PubmedQuery) {

	// Convert list of strings title to a single space seperated string.
	title := strings.Join(paper.Title, " ")
	pub_date := paper.Date
	abstract := strings.Join(paper.Abstract, " ")
	authors := strings.Join(paper.Authors, ", ")
	pmid := paper.PubMedID
	doi := paper.DOI
	// Convert to JSON strings
	cited_by, err := json.Marshal(paper.CitedBy)
	if err != nil {
		PubmedLogger.Printf("Encoding error: ", err)
	}
	cites, err := json.Marshal(paper.Cites)
	if err != nil {
		PubmedLogger.Printf("Encoding error: ", err)
	}
	keywords, err := json.Marshal(paper.Keywords)
	if err != nil {
		PubmedLogger.Printf("Encoding error: ", err)
	}
	// Check if paper is already in the database.
	checkPaper, err := IsPaperInDB(pmid)
	if err != nil {
		PubmedLogger.Printf("Check error: ", err)
	}
	// Begin database transaction.
	tx, err := db.Begin()
	if err != nil {
		PubmedLogger.Printf("DB transaction start error: ", err)
	}
	// If the paper is already in the database, overwrite.
	if checkPaper {
		sqlStmt := `
		UPDATE papers2
		SET title = $1, pub_date = $2, abstract = $3, authors = $4, doi = $5, cited_by = $6, cites = $7, keywords = $8
		WHERE pmid = $9
		`
		_, err = tx.Exec(sqlStmt, title, pub_date, abstract, authors, doi, cited_by, cites, keywords, pmid)
		if err != nil {
			PubmedLogger.Printf("DB write failed: ", err)
		}
		// Add paper to the database.
	} else {
		sqlStmt := `
		INSERT INTO papers2 (id, title, pub_date, abstract, authors, pmid, doi, cited_by, cites, site_stage_id, keywords)
		VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, (SELECT id FROM site_stage WHERE site = $9 AND stage = $10), $11)
		`
		_, err = tx.Exec(sqlStmt, title, pub_date, abstract, authors, pmid, doi, cited_by, cites, pmq.Site, pmq.Stage, keywords)
		if err != nil {
			PubmedLogger.Printf("DB write failed: ", err)
		}
	}
	// Commit change to the database.
	err = tx.Commit()
	if err != nil {
		PubmedLogger.Printf("DB transaction commit error: ", err)
	}
}

/*
	IsPaperInDB checks whether or not a certain pmid already exists in the db.
	This is used to prevent redundant queries and to correctly handle cases
	where data in the db should be overwritten.
*/
func IsPaperInDB(pmid string) (bool, error) {

	var checkPmid string
	sqlStmt := `SELECT pmid FROM papers2 WHERE pmid = $1`
	err := db.QueryRow(sqlStmt, pmid).Scan(&checkPmid)
	if err != nil {
		if err != sql.ErrNoRows {
			return true, err
		} else {
			return false, nil
		}
	}
	return true, nil
}

/*
	GetCiteNode receives a pmid and queries the local database to gather citation
	information contained on pubmed. A CiteNode contains the "cited by" and
	"cites" for a pmid.
*/
func GetCiteNode(pmid string) CiteNode {

	var node CiteNode
	PubmedLogger.Print(fmt.Sprintf("PMID: %s already exists in DB.", pmid))
	sqlStmt := `
	SELECT cited_by, cites
	FROM papers2
	WHERE pmid = $1`
	var cited_by string
	var cites string
	err := db.QueryRow(sqlStmt, pmid).Scan(&cited_by, &cites)
	if err != nil {
		PubmedLogger.Printf("Error retrieving papers: ", err)
	}
	var cited_by_arr []string
	json.Unmarshal([]byte(cited_by), &cited_by_arr)
	var cites_arr []string
	json.Unmarshal([]byte(cites), &cites_arr)
	node.CitedBy = cited_by_arr
	node.Cites = cites_arr

	return node
}

/*
	SelectData receives a DataSelector and returns an array of all PubmedData
	objects associated with the DataSelector site/stage.
*/
func SelectData(ds DataSelector) []PubmedData {
	data := make([]PubmedData, 0)

	sqlStmt := `
    SELECT p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, AVG(r.rating), p.keywords
    FROM papers2 p LEFT JOIN ratings2 r 
    ON p.id = r.paper_id
    WHERE p.site_stage_id = (
        SELECT id 
        FROM site_stage 
        WHERE site = $1 
        AND stage = $2
        )
    GROUP BY p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, p.keywords
    `
	rows, err := db.Query(sqlStmt, ds.Site, ds.Stage)
	if err != nil {
		PubmedLogger.Printf("Error retrieving papers: ", err)
	}
	defer rows.Close()
	for rows.Next() {
		var (
			title    string
			pub_date string
			abstract string
			authors  string
			pmid     string
			doi      string
			cited_by string
			cites    string
			avg      string
			keywords string
		)
		err := rows.Scan(&title, &pub_date, &abstract, &authors, &pmid, &doi, &cited_by, &cites, &avg, &keywords)
		if err != nil {
			PubmedLogger.Printf("Row scan error: ", err)
		}
		var cited_by_arr []string
		json.Unmarshal([]byte(cited_by), &cited_by_arr)
		var cites_arr []string
		json.Unmarshal([]byte(cites), &cites_arr)
		avg_n, _ := strconv.ParseFloat(avg, 64)
		var keywords_arr []string
		json.Unmarshal([]byte(keywords), &keywords_arr)
		data = append(data, PubmedData{
			Title:    strings.Split(title, " "),
			Date:     pub_date,
			Abstract: strings.Split(abstract, " "),
			Authors:  strings.Split(authors, ", "),
			PubMedID: pmid,
			DOI:      doi,
			CitedBy:  cited_by_arr,
			Cites:    cites_arr,
			Rank:     int(avg_n),
			Keywords: keywords_arr})
		//fmt.Println(pmid, int(avg_n))
	}
	err = rows.Err()
	if err != nil {
		PubmedLogger.Printf("Error reading rows: ", err)
	}

	// dat, err := json.Marshal(data)
	// if err != nil {
	// 	PubmedLogger.Printf("Encoding error: ", err)
	// }
	return data
}

/*
	ReadPmd works similarly to SelectData but filters based on a rating.
	Returns an array of all PubmedData for a specified site/stage that are
	at least a certain rating.
*/
func ReadPmd(site string, stage string, rating int) []PubmedData {
	data := make([]PubmedData, 0)

	sqlStmt := `
    SELECT p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, AVG(r.rating), p.keywords
    FROM papers2 p JOIN ratings2 r 
    ON p.id = r.paper_id
    WHERE p.site_stage_id = (
        SELECT id 
        FROM site_stage 
        WHERE site = $1 
        AND stage = $2
        )
    AND p.id IN (
        SELECT id
        FROM ratings2
        GROUP BY id
        HAVING AVG(rating) > $3
    )
    GROUP BY p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, p.keywords
    `
	rows, err := db.Query(sqlStmt, site, stage, rating)
	if err != nil {
		PubmedLogger.Printf("Error retrieving papers: ", err)
	}
	defer rows.Close()
	for rows.Next() {
		var (
			title    string
			pub_date string
			abstract string
			authors  string
			pmid     string
			doi      string
			cited_by string
			cites    string
			avg      int
			keywords string
		)
		err := rows.Scan(&title, &pub_date, &abstract, &authors, &pmid, &doi, &cited_by, &cites, &avg, &keywords)
		if err != nil {
			PubmedLogger.Printf("Row scan error: ", err)
		}
		var cited_by_arr []string
		json.Unmarshal([]byte(cited_by), &cited_by_arr)
		var cites_arr []string
		json.Unmarshal([]byte(cites), &cites_arr)
		var keywords_arr []string
		json.Unmarshal([]byte(keywords), &keywords_arr)
		data = append(data, PubmedData{
			Title:    strings.Split(title, " "),
			Date:     pub_date,
			Abstract: strings.Split(abstract, " "),
			Authors:  strings.Split(authors, ", "),
			PubMedID: pmid,
			DOI:      doi,
			CitedBy:  cited_by_arr,
			Cites:    cites_arr,
			Rank:     avg,
			Keywords: keywords_arr})
	}
	err = rows.Err()
	if err != nil {
		PubmedLogger.Printf("Error reading rows: ", err)
	}

	return data
}

/*
	GetPMD reads a single PubmedData object from the database. Receives a
	site, stage, and pmid to uniquely determine some paper and returns it.
*/
func GetPMD(site string, stage string, pmid string) PubmedData {
	sqlStmt := `
    SELECT p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, AVG(r.rating), p.keywords
	FROM papers2 p JOIN ratings2 r 	
	ON p.id = r.paper_id
	WHERE p.site_stage_id = (
        SELECT id 
        FROM site_stage 
        WHERE site = $1 
		AND stage = $2
		)
	AND p.pmid = $3
	GROUP BY p.title, p.pub_date, p.abstract, p.authors, p.pmid, p.doi, p.cited_by, p.cites, p.keywords
	`
	row := db.QueryRow(sqlStmt, site, stage, pmid)
	var (
		title    string
		pub_date string
		abstract string
		authors  string
		doi      string
		cited_by string
		cites    string
		avg      int
		keywords string
	)
	err := row.Scan(&title, &pub_date, &abstract, &authors, &pmid, &doi, &cited_by, &cites, &avg, &keywords)
	if err != nil {
		PubmedLogger.Printf("Row scan error: ", err)
	}
	var cited_by_arr []string
	json.Unmarshal([]byte(cited_by), &cited_by_arr)
	var cites_arr []string
	json.Unmarshal([]byte(cites), &cites_arr)
	var keywords_arr []string
	json.Unmarshal([]byte(keywords), &keywords_arr)
	data := PubmedData{
		Title:    strings.Split(title, " "),
		Date:     pub_date,
		Abstract: strings.Split(abstract, " "),
		Authors:  strings.Split(authors, ", "),
		PubMedID: pmid,
		DOI:      doi,
		CitedBy:  cited_by_arr,
		Cites:    cites_arr,
		Rank:     avg,
		Keywords: keywords_arr}

	return data
}

/*
	WriteRecs adds a list of pmids to the "reccomended" category in the db.
*/
func WriteRecs(pmidsRanked []string, ds DataSelector) {

	tx, err := db.Begin()
	if err != nil {
		PubmedLogger.Printf("DB transaction start error: ", err)
	}

	for rank, pmid := range pmidsRanked {
		// first check if pmid already ranked
		sqlStmt := `
        SELECT paper_id
        FROM recommendations
        WHERE paper_id IN (
            SELECT id
            FROM papers2
            WHERE pmid = $1
        ) 
        AND site_stage_id = (
            SELECT id
            FROM site_stage
            WHERE site = $2
            AND stage = $3
        )
        `
		var paper_id int
		err := tx.QueryRow(sqlStmt, pmid, ds.Site, ds.Stage).Scan(&paper_id)
		if err != nil {
			if err != sql.ErrNoRows {
				PubmedLogger.Print("Error checking if PMID in DB: ", err)
			} else {
				// if so update rank
				sqlStmt = `
				INSERT INTO recommendations (paper_id, site_stage_id, rank)
				VALUES ((
					SELECT id
					FROM papers2
					WHERE pmid = $1
					LIMIT 1
				), (
					SELECT id
					FROM site_stage
					WHERE site = $2
					AND stage = $3
				), $4)
				`
				_, err := tx.Exec(sqlStmt, pmid, ds.Site, ds.Stage, rank)
				if err != nil {
					PubmedLogger.Printf("DB write failed: ", err)
				}
			}
		} else {
			// if not, insert new ranking
			sqlStmt = `
			UPDATE recommendations
			SET rank = $1
			WHERE paper_id IN (
				SELECT id
				FROM papers2
				WHERE pmid = $2
			)
			AND site_stage_id = (
				SELECT id
				FROM site_stage
				WHERE site = $3
				AND stage = $4
			)
			`
			_, err := tx.Exec(sqlStmt, rank, pmid, ds.Site, ds.Stage)
			if err != nil {
				PubmedLogger.Printf("DB write failed: ", err)
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		PubmedLogger.Printf("DB transaction commit error: ", err)
	}
}
