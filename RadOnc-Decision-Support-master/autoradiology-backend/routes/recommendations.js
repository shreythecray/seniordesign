var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET treatment recommendations for site/stage */
router.get('/:site/:stage', function(req, res, next) {
  const site = req.params.site;
  const stage = decodeURI(req.params.stage);
  db.query(`SELECT treatment 
            FROM treatments2 
            WHERE site_stage_id=(
              SELECT id
              FROM site_stage
              WHERE site='${site}'
              AND stage='${stage}');`, (err, resp) => {
    if (err) console.error(err)
    res.send(resp.rows)
  })  
});

module.exports = router;
