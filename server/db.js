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

  saveTestResult: function (testData, ipAddress, callback) {
    dbConnection.serialize(function() {
      var testDataStr = JSON.stringify(testData);

      var sql = 'INSERT INTO test_results (json_data, ip_address, created_at) ' +
        'VALUES ($json_data, $ip_address, $created_at)';

      var values = {
        $json_data: testDataStr,
        $ip_address: ipAddress,
        $created_at: new Date().toISOString()
      };

      var statement = dbConnection.prepare(sql);

      statement.run(values, callback);
    });
  },

  // Gets all test results
  getTestResults: function (callback) {
    dbConnection.serialize(function() {
      var sql = 'SELECT json_data as results, created_at, ip_address FROM test_results ORDER BY created_at desc';
      dbConnection.all(sql, function(err, rows) {
        if (err) {
          return callback(err);
        }
        return callback(null, rows);
      });
    });
  }
};
