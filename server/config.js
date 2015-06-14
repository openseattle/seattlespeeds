'use strict';

module.exports = {
  sqlite: {
    filePath: __dirname + '/../db/seanetmap.sqlite'
  },

  // "Constants":
  LISTEN_PORT: 8000,

  STATIC_DIR: __dirname + '/../client',

  PERF_MAPS_DIR: __dirname + '/../test/data/seattle-perf-maps/',
  MAXMIND_ISP_DB_FILENAME: '/Users/john/jft/gits/seanetmap/maxmind-db/GeoIPISP.dat',
  HTML_TITLE: "Seattle Broadband Map",

  // TODO: If behind proxy like nginx, enable trust proxy by setting this true:
  IS_BEHIND_PROXY: false
};
