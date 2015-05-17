'use strict';

var config = require('./config');

var compression = require('compression');
var bodyParser  = require('body-parser');
var express     = require('express');
var db          = require('./db').connect();
var fs          = require('fs');
var morgan      = require('morgan');

var app         = express();
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// TODO: If behind proxy like nginx, enable trust proxy:
// http://expressjs.com/guide/behind-proxies.html
// app.enable('trust proxy')

// JFT 2015-05-16 moving to new client struct: var index = fs.readFileSync(config.STATIC_DIR + '/index.html');
var index = fs.readFileSync(config.STATIC_DIR + '/index.html');
app.get('/', function (req, res) {
  res.end(index);
});
app.use('/client', express.static(config.STATIC_DIR));
app.use('/json', express.static(config.PERF_MAPS_DIR));


// This is just to test that the widget is embeddable in an iframe
// TODO: this should really not be in here, rather part of some test machinery
var embedder = fs.readFileSync(__dirname + '/../test/embedder.html');
app.get('/embedder', function (req, res) {
  res.end(embedder);
});


var server = app.listen(config.LISTEN_PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('SEANetMap listening at http://%s:%s', host, port);
  // TODO: need to mod this away from "listening at http:" when TLS is
  // involved. Although, in real-world deploy context SEANetMap will
  // be behind proxies so it may well be only dealing with HTTP, not
  // HTTPS...
});



// Endpoint for saving test results
app.post('/test_results', function (req, res) {
  db.saveTestResult(req.body, req.ip, function (err, data) {

    if (err) {
      return res.status(500).send(err);
    }

    return res.status(200).end();
  });
});

// Endpoint for getting **all of the test results**
app.get('/test_results', function (req, res) {
  db.getTestResults(function (err, rows) {
    if (err) {
      return res.status(500).send(err);
    }

    var response = rows.map(function (row) {
      return {
        results: JSON.parse(row.results),
        ip_address: row.ip_address,
        created_at: row.created_at
      }
    });

    return res.send(response);
  });
});
