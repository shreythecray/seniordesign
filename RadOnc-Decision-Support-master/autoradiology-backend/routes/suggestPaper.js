var express = require('express');
var router = express.Router();
var request = require('request');

const db = require('../db');

/* POST new paper suggestion */
router.post('/', function (req, res, next) {
    var pmq = {
        site: req.body.site,
        stage: req.body.stage,
        max: 1,
        pmids: [req.body.pmid]
    }
    // call go server to check if paper exists
    // if paper exists this will return null, otherwise the go server will store in db
    request({
        url: "http://autorad-go:8088/get-paper-data",
        method: "POST",
        json: true,
        body: pmq
    }, (err, resp, body) => {
        // paper already exists
        if (body == null) {
            // get paper id
            db.query(`
            SELECT id
            FROM papers2
            WHERE pmid = '${req.body.pmid}'
            AND site_stage_id = (
               SELECT id
               FROM site_stage
               WHERE site='${req.body.site}'
               AND stage='${req.body.stage}'
            )`, (err3, res3) => {
                    if (err3) console.log(err3);
                    if (res3.rows.length != 0) {
                        // add the new rating
                        db.query(`
                        INSERT INTO ratings2 (paper_id, user_id, site_stage_id, rating)
                        VALUES (
                            ${res3.rows[0].id},
                            ${req.body.user_id}, 
                            (
                            SELECT id
                            FROM site_stage
                            WHERE site='${req.body.site}'
                            AND stage='${req.body.stage}'
                            ),
                            ${req.body.rating}
                        )`, (err2, res2) => {
                                if (err2) console.error(err2);
                                res.sendStatus(200);
                            })
                    }
                    else res.sendStatus(406);
                })
        }
        // paper was just added so add rating
        else {
            db.query(`
            INSERT INTO ratings2 (paper_id, user_id, site_stage_id, rating)
            VALUES (
                (SELECT id 
                 FROM papers2 
                 WHERE pmid = '${req.body.pmid}'
                 AND site_stage_id = (
                    SELECT id
                    FROM site_stage
                    WHERE site='${req.body.site}'
                    AND stage='${req.body.stage}'
                 )),
                 ${req.body.user_id}, 
                (
                SELECT id
                FROM site_stage
                WHERE site='${req.body.site}'
                AND stage='${req.body.stage}'
                ),
                ${req.body.rating}
            )`, (err2, res2) => {
                    if (err2) console.error(err2);
                    res.sendStatus(200);
                })

        }
    })

});

module.exports = router;