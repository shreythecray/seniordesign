var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET list of sites. */
router.get('/', function(req, res, next) {
  db.query('SELECT DISTINCT site FROM site_stage;', (err, resp) => {
    if (err) console.error(err)
    res.send(resp.rows)
  })  
});

module.exports = router;
