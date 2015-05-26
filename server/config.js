'use strict';

module.exports = {
  sqlite: {
    filePath: __dirname + '/../db/seanetmap.sqlite'
  },

  // "Constants":
  LISTEN_PORT: 8000,

  STATIC_DIR: __dirname + '/../client',
  // JFT 2015-05-16 disabled while rebooting client to start with mlab code clean: 
  // STATIC_DIR: __dirname + '/../static'

  PERF_MAPS_DIR: __dirname + '/../test/data/seattle-perf-maps/',
  MAXMIND_ISP_DB_FILENAME: '/path/to/GeoIPASNum.dat',
  HTML_TITLE: "Seattle Broadband Map",

  // TODO: If behind proxy like nginx, enable trust proxy by setting this true:
  IS_BEHIND_PROXY: false
};
