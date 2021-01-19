var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

const db = require('../db');

/* POST request to change password */
router.post('/', (req, res) => {
    // get the reset email associated with the token from the resets table
    db.query(`
    SELECT email 
    FROM pw_resets
    WHERE token = '${req.body.token}'
    `, (err, resp) => {
        if (err) console.error(err);
        if (resp.rows.length != 0) {
            // hash the new pw and store
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                db.query(`
                UPDATE users
                SET password = '${hash}'
                WHERE email = '${resp.rows[0].email}'
                `, (err2, resp2) => {
                    if (err2) console.error(err2);
                    else {
                        // delete the token
                        db.query(`
                        DELETE FROM pw_resets
                        WHERE token = '${req.body.token}'
                        `, (err3, resp3) => {
                            if (err3) console.error(err3);
                        })
                    }
                })
            }) 
        }
    })
    res.sendStatus(200);
})

module.exports = router;