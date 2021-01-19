var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

const db = require('../db');

/* POST new user signup */
router.post('/', (req, res) => {
    // check if user exists
    db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`, (err, resp) => {
        if (err) console.error(err);
        // send 403 if exists
        if (resp.rows.length != 0) {
            res.sendStatus(403);
        }
        else {
            // hash the password and store
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                db.query(`INSERT INTO users VALUES ('${req.body.email}', '${hash}', DEFAULT)`, (err1, resp) => {
                    if (err1) console.error(err1);
                    res.sendStatus(200);
                })
            });
        }
    })
})

module.exports = router;
