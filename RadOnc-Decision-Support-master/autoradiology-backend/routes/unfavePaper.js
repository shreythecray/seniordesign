var express = require('express');
var router = express.Router();

const db = require('../db');

/* POST unsaved papet */
router.post('/', function(req, res, next) {
    db.query(`
    DELETE FROM favorites
    WHERE paper_id = ${req.body.paper_id}
    AND site_stage_id = (
        SELECT id
        FROM site_stage
        WHERE site = '${req.body.site}'
        AND stage = '${req.body.stage}'
    )
    AND user_id = ${req.user.id}
    `, (err, resp) => {
        if (err) console.error(err);
        res.sendStatus(200);
    })
});

module.exports = router;