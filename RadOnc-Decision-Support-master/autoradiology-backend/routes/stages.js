var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET stages for a site */
router.get('/:site', function(req, res, next) {
  const { site } = req.params
  db.query(`SELECT DISTINCT stage FROM site_stage WHERE site='${site}'`, (err, resp) => {
    if (err) console.error(err)
    res.send(resp.rows)
  })  
});

module.exports = router;
