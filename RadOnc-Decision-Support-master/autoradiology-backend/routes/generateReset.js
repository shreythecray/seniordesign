var crypto = require('crypto');
var express = require('express');
var router = express.Router();

const sgMail = require('@sendgrid/mail');
const db = require('../db');

sgMail.setApiKey('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');

/* POST request to generate a password reset link */
router.post('/', (req, res) => {
    // check if user exists
    db.query('SELECT * FROM users WHERE email = \''+req.body.email+'\'', (err, resp) => {
        if (err) console.error(err);
        // if user exists
        if (resp.rows.length != 0) {
            // generate a new token and store it
            const token = crypto.randomBytes(20).toString('hex');
            db.query(`
            INSERT INTO pw_resets (email, token, expiration) 
            VALUES ('${req.body.email}', '${token}', ${Date.now()+3600000})`, (err2, resp2) => {
                if (err2) console.error(err2);
                // send reset email
                const msg = {
                    to: req.body.email,
                    from: 'reset@autorad.com',
                    subject: 'Reset Your Password',
                    text: 
                    `We've received a password reset request for your account.\n 
                    To reset your password, follow this link: http://34.74.246.237:3000/password-reset/${token}\n 
                    This link will expire in 1 hour.\n
                    If you didn't request a password reset, ignore this email and your password will remain unchanged.`
                };
                sgMail.send(msg);
            })
            // send 200 indicating success
            res.sendStatus(200);
        }
        // send 404 indicating user does not exist
        else res.sendStatus(404);
    })
})

module.exports = router;
