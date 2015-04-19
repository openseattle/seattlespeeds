window.addEventListener('load', function () {
  startup();
}, false);

var startup = function () {
  // Create the map
  var center = [47.56029039903832,-122.33809844970702];
  var zoom = 10;
  var map = L.map('map').setView(center, zoom);

  var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });

  var mapboxLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/newamerica.lcl1jan5/{z}/{x}/{y}.png', {
	  attribution: '&copy; <a href="http://mapbox.com/">Mapbox</a>'
  });

  // Set the default base tile layer
  map.addLayer(mapboxLayer);

  // Global overlay layer variables
  setHexLayer(2015, 3, 'download_median', 'low', 'new');
};

function updateLayers(e, mode) {
	if ( overlays['hex']['enabled'] ) {
		setHexLayer(2015, 3, 'download_median', 'low', mode);
	}
}

function getHexColor(val) {
    return val > 50 ? 'blue' :
           val > 25 ? 'green' :
           val > 10 ? 'purple' :
           val > 5  ? 'yellow' :
           val > 0  ? 'red' : 'transparent';
}


var geoJsonCache = {};
function getLayerData (url, callback) {
	if ( geoJsonCache[url] ) {
		console.log('Using cached version of ' + url);
		callback(geoJsonCache[url]);
	} else {
		console.log('Fetching and caching ' + url);
		$.get(url, function(response) {
			geoJsonCache[url] = response;
			callback(response)
		}, 'json');
	}
}

function setHexLayer(year, month, metric, resolution, mode) {
	month = month < 10 ? '0' + month : month;
	var hex_url = '/static/geojson/' + year + '_' + month + '-' + resolution + '.json';

	getLayerData(hex_url, function(response) {
		response.features.forEach( function(cell) {
			var value = cell.properties[metric];
			var hexStyle = cell.hexStyle = {};

			hexStyle.weight = 1;
			hexStyle.fillOpacity = 0.5;

			if ( ! value ) {
				hexStyle.weight = 0;
				hexStyle.fillOpacity = 0;
			} else if ( metric == 'download_median' && cell.properties['download_count'] < 30 ) {
				hexStyle.weight = 0.5;
				hexStyle.fillOpacity = 0.05;
				hexStyle.color = 'black';
			} else if ( metric == 'upload_median' && cell.properties['upload_count'] < 30 ) {
				hexStyle.weight = 0.5;
				hexStyle.fillOpacity = 0.05;
				hexStyle.color = 'black';
			} else {
				hexStyle.color = getHexColor(value);
			}
		});

		if ( map.hasLayer(hexLayer) ) {
			map.removeLayer(hexLayer);
			var hexLayerVisible = true;
		}

		hexLayer = L.geoJson(response).eachLayer( function(l) {
			l.setStyle(l.feature['hexStyle']);
		});

		map.addLayer(hexLayer);
	});
}
