var express = require('express');
var router = express.Router();

const db = require('../db');

/* POST update user paper rating */
router.post('/', function(req, res, next) {
  db.query(`UPDATE ratings2 
            SET rating=${req.body.rating}
            WHERE paper_id=${req.body.paper_id}
            AND user_id=${req.body.user_id}
            AND site_stage_id=(
                SELECT id
                FROM site_stage
                WHERE site='${req.body.site}'
                AND stage='${req.body.stage}'
            );`, (err, resp) => {
    if (err) console.error(err)
    res.sendStatus(200);
  }); 
});

module.exports = router;