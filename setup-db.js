#!/usr/bin/env node

var config = require('./server/config');
var dbConnection = require('./server/db.js').connect().getRawConnection();
var fs = require('fs');

console.log('Creating empty sqlite database file at ' + config.sqlite.filePath);
fs.writeFileSync(config.sqlite.filePath, '');

dbConnection.run('CREATE TABLE test_results (json_data TEXT)');

console.log('sqlite db schema created\n');
