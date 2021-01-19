var express = require('express');
var router = express.Router();

const db = require('../db');

/* POST a new paper rating */
router.post('/', function(req, res, next) {
  db.query(`INSERT INTO ratings2 VALUES (
    ${req.body.paper_id}, 
    ${req.body.user_id}, 
    (
      SELECT id
      FROM site_stage
      WHERE site='${req.body.site}'
      AND stage='${req.body.stage}'
    ),
    ${req.body.rating});`, (err, resp) => {
    if (err) console.error(err)
    res.sendStatus(200);
  }); 
});

module.exports = router;