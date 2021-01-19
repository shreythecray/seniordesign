var express = require('express');
var router = express.Router();
var request = require('request');

/* GET if the model is running for site/stage */
router.get('/:site/:stage', function(req, res, next) {
    var model_body = {
        site: req.params.site,
        stage: req.params.stage
    }
    request({
        url: "http://autorad-go:8088/query-running",
        method: "POST",
        json: true,
        body: model_body
    }, (err, resp, body) => {
        if (err) console.error(err);
        console.log(body)
        if (body == true) res.sendStatus(200);
        else if (body == false) res.sendStatus(204);
    })
    
});

module.exports = router;