'use strict';

var sqlite3 = require('sqlite3').verbose();
var config = require('./config');

var dbConnection;

module.exports = {
  getRawConnection: function () {
    return dbConnection;
  },

  connect: function () {
    dbConnection = new sqlite3.Database(config.sqlite.filePath);
    return this;
  },

  disconnect: function () {
    dbConnection.close();
  },

  saveTestResult: function (resultData, callback) {
    dbConnection.serialize(function() {
      var resultText = JSON.stringify(resultData);
      var stmt = dbConnection.prepare('INSERT INTO test_results (json_data) VALUES (?)');

      stmt.run(resultText, callback);
    });
  },

  getTestResults: function (callback) {
    dbConnection.serialize(function() {
      dbConnection.all('SELECT json_data FROM test_results', function(err, rows) {
        if (err) {
          return callback(err);
        }
        return callback(null, rows);
      });
    });
  }
};
