var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET user rating for a paper */
router.get('/:pid/:site/:stage', function(req, res, next) {
  const { pid, site, stage } = req.params;
  db.query(`SELECT rating 
            FROM ratings2 
            WHERE paper_id=${pid} 
            AND user_id=${req.user.id}
            AND site_stage_id = (
              SELECT id
              FROM site_stage
              WHERE site='${site}'
              AND stage='${stage}'
            )`, (err, resp) => {
    if (err) console.error(err)
    // if user has not rated paper, send unrated
    if (resp.rows.length == 0) {
      res.send('{"rating": "Unrated"}')
    }
    else {
      res.send(resp.rows[0]);
    }
  }); 
});

module.exports = router;