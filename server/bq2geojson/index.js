/**
 * Copyright © 2015 Measurement Lab, Nathan Kinkade
 * 
 * This code is released into the public domain under a CC0 waiver.  You may
 * read more about this waiver on the Creative Commons website:
 * https://creativecommons.org/publicdomain/zero/1.0/
 */

// Where polygon objects will live.
var polygons = {};

// Can be one of "file" or "hex".  If file, then set polygonFile.
var polygonType = "hex";

// An array of absolute paths to polygon files, if polygonType == "file".
var polygonFiles = [];

// If polygonType == 'hex', the three cell widths used to make the low, medium
// and high resolution hex layers:
// http://turfjs.org/static/docs/module-turf_hex-grid.html
// Some suitable values might be:
//   > City level: 0.01, 0.0075, 0.005
//   > State level: 0.05, 0.0375, 0.025
//   > USA level: 
var cellWidths = {
	low : 0.01,
	medium : 0.0075,
	high : 0.005
};

// Directories where CSV and GeoJSON output get written to files.
//
// 'csv': Where the CSV files from BigQuery will be written. By defaul they
// will go in the bigquery/ directory since, well, it is BigQuery data.
//
// 'json': Where to write Topo/GeoJSON files. By default they will go in the
// ./html/ directory since they will be consumed by a browser. Please not that
// if you change this you will also have to change some front-end code in the
// html/ directory.
//
// 'tmp': Temporary directory where intermediate files are stored.  In case
// something fails, these won't have to be generated again, potentially.  And
// maybe useful for debugging.
var dirs = {
	'csv': './bigquery/csv/',
	'json': './html/json/',
	'tmp': './tmp/'
};

// When running aggregate functions on the data, these are the various
// properties that should be added to the GeoJSON for the download and upload
// throughput tests, respectively. 'count', as the name implies, will host the
// value of how many data points per hex cell there are for that test.
// 'averages' is an array that holds the fields that need to be averaged.
var properties = {
	'download': {
		'count': 'download_count',
		'averages': ['download_throughput', 'rtt_average']
	},
	'upload': {
		'count': 'upload_count',
		'averages': ['upload_throughput']
	}
};

// This defines the aggregate calculations that need to happen on each data
// set: http://turfjs.org/examples/turf-aggregate/
aggregations = {
	'download': [
		{
			'aggregation': 'count',
			'inField': 'download_throughput',
			'outField': 'download_count'
		},
		{
			'aggregation': 'median',
			'inField': 'download_throughput',
			'outField': 'download_median'
		},
		{
			'aggregation': 'average',
			'inField': 'download_throughput',
			'outField': 'download_avg'
		},
		{
			'aggregation' : 'average',
			'inField': 'rtt_average',
			'outField': 'rtt_avg'
		}
	],
	'upload': [
		{
			'aggregation': 'count',
			'inField': 'upload_throughput',
			'outField': 'upload_count'
		},
		{
			'aggregation': 'median',
			'inField': 'upload_throughput',
			'outField': 'upload_median'
		},
		{
			'aggregation': 'average',
			'inField': 'upload_throughput',
			'outField': 'upload_avg'
		}
	]
};

// STOP
//
// All user-defined variables are set above.  You probably shouldn't edit below
// this line unless you want to modify the overall behavior of the program.

// Require any dependencies
var turf = require('turf');
	csv2geojson = require('csv2geojson').csv2geojson,
	topojson = require('topojson').topology,
	fs = require('fs'),
	async = require('async'),
	exec = require('child_process').execSync;


// Validate the year passed, minimally.
if ( process.argv[2] ) {
	if ( process.argv[2].match('^[0-9]{4}$') ) {
		var year = process.argv[2];
	} else {
		console.log('The first argument does not appear to be a year.');
		process.exit(1);
	}
} else {
	console.log('The first argument must be a year.');
	process.exit(1);
}

// Validate the month arguments passed, else populate months[] with 01-12.
var months = [];
if ( process.argv[3] ) {
	process.argv.slice(3).forEach( function(month) {
		if ( month.match('^[0-9]{2}$') ) {
			months.push(month);
		} else {
			console.log('Month arguments must be two digits.');
			process.exit(1);
		}
	});
} else {
	for ( var i = 1; i <= 12; i++ ) { 
		var val = i > 9 ? i : '0' + i;
		months.push(val);
	}
}

// Make sure polygon file exists, if specified, and if so, read it into the
// polygons object.
if (polygonType == 'file') {
	polygonFiles.forEach( function(polygonFile) {
		try {
			fs.statSync(polygonFile).isFile();
			console.log('* Reading polygon file ' + polygonFile); 
			// Strip off path and any file extension, and use that as the object
			// key.
			var fileName = polygonFile.split('/').pop().split('.')[0];
			polygons[fileName] = JSON.parse(fs.readFileSync(polygonFile,
				encoding='utf8'));
		} catch(err) {
			if ( ! err.code == 'ENOENT' ) {
				throw err;
			}
		}
	});
}

// Make the necessary base directories.
for (var dir in dirs) {
	createDir(dirs[dir]);
}

// The year will never change for a given run, so loop through all the months
// and use the year_month combination to determine which tables to query in
// BigQuery, and also use it for the directory structure that gets created.
for ( var i = 0; i < months.length; i++ ) {
	var	centerLat,
		centerLon;

	// Some convenient variables to have on hand
	var subDir = year + '_' + months[i];
	var csvPath = dirs.csv + subDir;

	createDir(csvPath);

	// Calculate CSV file paths for convenience
	var downPath = csvPath + '/download.csv';
	var upPath = csvPath + '/upload.csv';

	// Read in query files and substitute the table placeholder with the actual
	// table name, based on the current month/year of the loop
	var downQuery = fs.readFileSync('bigquery/bq_download', encoding='utf8')
		.replace('TABLENAME', subDir);
	var upQuery = fs.readFileSync('bigquery/bq_upload', encoding='utf8')
		.replace('TABLENAME', subDir);

	// Get CSV from BigQuery
	console.log('* Querying BigQuery for download throughput data for ' +
		months[i] + '/' + year + '.');
	var csvDown = getCsv(downPath, downQuery);
	console.log('* Querying BigQuery for upload throughput data for ' +
		months[i] + '/' + year + '.');
	var csvUp = getCsv(upPath, upQuery);

	// Convert CSV to GeoJSON and then process with Turf
	async.parallel({
		'download': function(callback) {
			console.log('* Converting download throughput CSV data to ' +
				'GeoJSON.');
			csv2geojson(csvDown, function(err, geojson) {
				callback(null, geojson);
			});
		},
		'upload': function(callback) {
			console.log('* Converting upload throughput CSV data to GeoJSON.');
			csv2geojson(csvUp, function(err, geojson) {
				callback(null, geojson);
			});
		}
	}, function (err, results) {

		fs.writeFileSync(dirs.tmp + subDir + '-download.geojson',
			JSON.stringify(results.download));
		fs.writeFileSync(dirs.tmp + subDir + '-upload.geojson',
			JSON.stringify(results.upload));

		// The combined up/down features will be used to add a map layer with a
		// scatter plot of all the data points.
		var updown = turf.featurecollection(results.download.features.concat(
			results.upload.features));
		fs.writeFileSync(dirs.json + subDir + '-plot.geojson', JSON.stringify(
			updown));
		console.log('* Wrote file ' + dirs.json + subDir + '-plot.geojson');

		// Record the lat/lon of the center of the combined polygons.  Later we
		// will write these to a file that can be used by the front-end to more
		// or less center the map correct (though not perfectly). These will, of
		// course, get overwritten for very iteration of the loop but it doesn't
		// matter since we only care about the approximate center, and the
		// processing for this should be minimal.
		centerLon = turf.center(updown).geometry.coordinates[0];
		centerLat = turf.center(updown).geometry.coordinates[1];

		// We do this here instead of in the same place as if polygonType ==
		// "file" because the hexgrid is not a fixed size, but is only as
		// large as needed based on the data points, which may save processing
		// time and files size.
		if ( polygonType == 'hex' ) {
			polygons = createHexgrids(updown);
		}

		for ( polygon in polygons ) {
			console.log('* Aggregating download throughput data for ' +
				polygon);
			polygons[polygon] = aggregate(polygons[polygon], results.download,
				properties.download, aggregations.download);
			fs.writeFileSync(dirs.tmp + subDir + '-download-aggregate-' +
				polygon + '.geojson', JSON.stringify(polygons[polygon]));
			console.log('* Aggregating upload throughput data for ' + polygon);
			polygons[polygon] = aggregate(polygons[polygon], results.upload,
				properties.upload, aggregations.upload);
			fs.writeFileSync(dirs.tmp + subDir + '-final-aggregate-' +
				polygon + '.geojson', JSON.stringify(polygons[polygon]));
			fs.writeFileSync(dirs.json + subDir + '-' + polygon + '.geojson',
				JSON.stringify(polygons[polygon]));
			console.log('* Wrote file ' + dirs.json + subDir + '-' +
				polygon + '.geojson');

			// The process of coverting to TopoJSON is destructive to the input
			// GeoJSON.  Stringifying the object then parsing it _should_ clone
			// the object into a new one.
			var topoCollection = JSON.parse(JSON.stringify(polygons[polygon]));
			var topojsonResult = topojson(
				{
					'collection': topoCollection
				},
				{
					'property-transform': function(feature) {
						return feature.properties;
					}
				}
			);
			fs.writeFileSync(dirs.json + subDir + '-' + polygon + '.topojson',
				JSON.stringify(topojsonResult));
			console.log('* Wrote file ' + dirs.json + subDir + '-' +
				polygon + '.topojson');
		}

		// The process of coverting to TopoJSON is destructive to the input
		// GeoJSON, but we won't need 'updown' again for this iteration.
		var topojsonPlot = topojson({'collection': updown});
		fs.writeFileSync(dirs.json + subDir + '-plot.topojson', JSON.stringify(
			topojsonPlot));
		console.log('* Wrote file ' + dirs.json + subDir + '-plot.topojson');

	});
}

// Write the center point of one of the polygon objects to a file that will be
// used to center the map in more or less the right place automatically rather
// than having to manually set the variable.
fs.writeFileSync('./html/js/center.js', 'var center = [' + centerLat +
	',' + centerLon + '];');
console.log('* Wrote file ./html/js/center.js');

/**
 * Takes a FeatureCollection and creates a bounding box that contains all of
 * the features. The distance across the bounding box is calculate because at
 * some point we may want to use this to auto define cellWidths instead of
 * having to manually set them.
 *
 * @param {object} json GeoJSON FeatureCollection
 * @returns {array} Array of 3 GeoJSON objects at various resolutions.
 */
function createHexgrids(json) {

	// Create the bounding box using features from both the download and upload
	var bbox = turf.extent(json);
	var bboxPoly = turf.bboxPolygon(bbox);
	var point1 = turf.point(bboxPoly.geometry.coordinates[0][0]);
	var point2 = turf.point(bboxPoly.geometry.coordinates[0][1]);
	var distance = turf.distance(point1, point2, 'miles');

	var hexgrids =  {
		'low': turf.hex(bbox, cellWidths.low, 'miles'),
		'medium': turf.hex(bbox, cellWidths.medium, 'miles'),
		'high': turf.hex(bbox, cellWidths.high, 'miles'),
	}

	return hexgrids;

}

/**
 * Do the actual fetching of data from BigQuery
 *
 * @param {string} path Path to BigQuery CSV output file
 * @param {string} query The query to run
 * @returns {string} Result from BigQuery in CSV format
 */
function getCsv(path, query) {
	// Options passed to the bq client. These probably shouldn't be changed -n:
	// defines an arbitrarily high number of results to return that we should
	// never surpass in practice, and just makes sure we get everything.
	// 
	// --format csv: output format should be CSV.
	//
	// --quiet: don't output status messages, since they'd end up in the CSV.
	//
	// --headless: don't know what effect this has, but seems good since this
	// may possibly be automated in some way.
	var bqOpts='-n 1000000 --format csv --quiet --headless';

	try {
		fs.statSync(path).isFile();
		console.log('* CSV file ' + path + ' already exists. Skipping ...'); 
		return fs.readFileSync(path, encoding='utf8');
	} catch(err) {
		if ( ! err.code == 'ENOENT' ) {
			throw err;
		}
	}

	var start = new Date();
	var result = exec('bq query ' + bqOpts + ' "' + query + '"',
		{'encoding' : 'utf8'});
	elapsed(start);
	fs.writeFileSync(path, result);
	console.log('* Wrote CSV file ' + path + '.');

	return result;
}

/**
 * Aggregate the various properties of the GeoJSON.
 *
 * @param {object} polygon Polygon object in GeoJSON format 
 * @param {object} json GeoJSON object containing data to analyze
 * @param {object} fields Which properties of json to process
 * @param {array} aggs Defines which aggregations should happen
 * @returns {object} GeoJSON object with aggregated data
 */
function aggregate(polygon, json, fields, aggs) {
	json = makeNumeric(json, fields.averages);

	var start = new Date();
	var json = turf.aggregate(polygon, json, aggs);
	elapsed(start);

	return json;
}

/**
 * While we're looping through the object, also take the opportunity to covert
 * any any values to a number so that Turf.js can perform math on it properly:
 * https://github.com/mapbox/csv2geojson/issues/31
 *
 * @param {object} json GeoJSON object with data to be processed
 * @param {object} fields Which properties of json to process
 * @returns {object} GeoJSON data with numeric values coverted to Numbers
 */
function makeNumeric(json, fields) {
	for ( var i = 0; i < json.features.length; i++ ) { 
		for ( var field in fields ) {
			var numericVal = Number(
				json.features[i].properties[fields[field]]);
			json.features[i].properties[fields[field]] = numericVal;
		}
	}
	return json;
}

/**
 * Simple function to return elapsed time in hours, minutes, seconds.
 *
 * @param {object} start Date object representing start time
 */
function elapsed(start) {
	var end = new Date();
	var elapsed = (end.getTime() - start.getTime()) / 1000;
	var hours = Math.floor(elapsed / 3600) + 'h ';
	var minutes = Math.floor((elapsed % 3600) / 60) + 'm ';
	var seconds = Math.floor((elapsed % 3600) % 60) + 's';
	console.log('  ... operation completed in ' + hours + minutes + seconds); 
}

/**
 * Create a directory
 *
 * @param {string} dir Path and name of directory to create
 */
function createDir(dir) {
	try {
		fs.mkdirSync(dir);
	} catch(err) {
		if ( err.code != 'EEXIST' ) {
			throw err;
		}
	}
}
