var express = require('express');
var router = express.Router();

const db = require('../db');

/* POST a new saved paper */
router.post('/', function(req, res, next) {
    db.query(`
    INSERT INTO favorites (paper_id, site_stage_id, user_id)
    VALUES (
        ${req.body.paper_id}, 
        (
            SELECT id
            FROM site_stage
            WHERE site = '${req.body.site}'
            AND stage = '${req.body.stage}'
        ),
        ${req.user.id}
        )
    `)
    res.sendStatus(200);
});

module.exports = router;