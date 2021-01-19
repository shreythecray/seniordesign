var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET recommended papers for a site and stage */
router.get('/:site/:stage', function(req, res, next) {
  const { site, stage } = req.params
  db.query(
    `SELECT title, authors, abstract, doi, id 
    FROM papers2
    WHERE site_stage_id = (
      SELECT id
      FROM site_stage
      WHERE site='${site}'
      AND stage='${stage}'
    )
    AND id NOT IN (
      SELECT paper_id 
      FROM ratings2 
      WHERE user_id = ${req.user.id}
      AND site_stage_id=papers2.site_stage_id
    )
    AND id IN (
      SELECT paper_id
      FROM recommendations
      WHERE site_stage_id=papers2.site_stage_id
      ORDER BY rank
    )
    AND id NOT IN (
      SELECT paper_id
      FROM favorites
      WHERE user_id = ${req.user.id}
      AND site_stage_id = (
          SELECT id
          FROM site_stage
          WHERE site = '${site}'
          AND stage = '${stage}'
      )
    )
    LIMIT 10`, (err, resp) => {
    if (err) console.error(err)
    res.send(resp.rows)
  })  
});

module.exports = router;