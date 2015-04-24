#!/usr/bin/env node

var config = require('./server/config');
var dbConnection = require('./server/db.js').connect().getRawConnection();
var fs = require('fs');

console.log('Creating empty sqlite database file at ' + config.sqlite.filePath);
fs.writeFileSync(config.sqlite.filePath, '');

// ip address
// created_at

dbConnection.run('CREATE TABLE test_results (json_data TEXT, ip_address TEXT, created_at TEXT)');

console.log('sqlite db schema created\n');
