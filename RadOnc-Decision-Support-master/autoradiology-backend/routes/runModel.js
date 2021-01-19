var express = require('express');
var router = express.Router();
var request = require('request');

/* POST request to invoke the model */
router.post('/', function(req, res, next) {
    var model_body = {
        site: req.body.site,
        stage: req.body.stage
    }
    request({
        url: "http://autorad-go:8088/run-model",
        method: "POST",
        json: true,
        body: model_body
    })
    res.sendStatus(200);
});

module.exports = router;