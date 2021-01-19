var crypto = require('crypto');
var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET if reset token is valid */
router.get('/:token', (req, res) => {
    db.query(
        `SELECT * FROM pw_resets 
        WHERE token = '${req.params.token}'
        AND expiration > ${Date.now()}`, (err, resp) => {
        if (err) console.error(err);
        // send 200 if valid
        if (resp.rows.length != 0) {
            res.sendStatus(200);
        }
        // send 404 if invalid
        else res.sendStatus(404);
    })
})

module.exports = router;
