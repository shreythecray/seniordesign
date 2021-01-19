var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET saved papers */
router.get('/:site/:stage', function(req, res, next) {
  db.query(`
  SELECT title, authors, abstract, doi, id
  FROM papers2
  WHERE id IN (
      SELECT paper_id
      FROM favorites
      WHERE user_id = ${req.user.id}
      AND site_stage_id = (
          SELECT id
          FROM site_stage
          WHERE site = '${req.params.site}'
          AND stage = '${req.params.stage}'
      )
  )`, (err, resp) => {
    if (err) console.error(err)
    res.send(resp.rows)
  })  
});

module.exports = router;
