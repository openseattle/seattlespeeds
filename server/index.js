'use strict';

var compression = require('compression');
var bodyParser = require('body-parser');
var express = require('express');
var db = require('./db').connect();
var fs = require('fs');
var morgan = require('morgan');

var app = express();
var STATIC_DIR = __dirname + '/../static';

app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser());

var index = fs.readFileSync(STATIC_DIR + '/index.html');
app.get('/', function (req, res) {
  res.end(index);
});

app.use('/static', express.static(STATIC_DIR));

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Seanetmap app listening at http://%s:%s', host, port);
});

app.post('/test_results', function (req, res) {
  db.saveTestResult(req.body, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.status(200).end();
  });
});

app.get('/test_results', function (req, res) {
  db.getTestResults(function (err, rows) {
    if (err) {
      return res.status(500).send(err);
    }
    var result = rows.map(function (row) {
      return row.json_data;
    });
    return res.send(result);
  });
});
