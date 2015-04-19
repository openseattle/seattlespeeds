var compression = require('compression');
var express = require('express');
var fs = require('fs');
var morgan = require('morgan');

var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.use(morgan('combined'));
app.use(compression());

var index = fs.readFileSync(__dirname + '/static/index.html');
app.get('/', function (req, res) {
  res.end(index);
});

app.use('/static', express.static(__dirname + '/static'));

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
