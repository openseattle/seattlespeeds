/**
 * Creates the map legend that will appear in the lower right corner of the map.
 *
 * @returns {object} DOM object for map legend
 */
function addLegend() {
	var legend = L.control({position: 'bottomright'});

	legend.onAdd = function(map) {
	    var div = L.DomUtil.create('div', 'info legend'),
	        grades = [0, 5, 10, 25, 50];

		div.innerHTML = '';
	    for ( var i = 0; i < grades.length; i++ ) {
	        div.innerHTML +=
	            '<i style="background:' + getPolygonColor(grades[i] + 1) +
				'"></i> ' + (i == 0 ? '0' : grades[i]) + (grades[i + 1] ?
				'&ndash;' + grades[i + 1] + ' Mbps<br/>' : '+ Mbps');
	    }
	    div.innerHTML += '<br/><i style="background: black; opacity: .2">' +
			'</i>Insuff. data';
	    return div;
	};
	legend.addTo(map);
}

/**
 * Add various map controls to the lower left corner of the map.
 *
 * @returns {object} DOM object for the controls box
 */
function addControls() {
	var controls = L.control({position: 'bottomleft'});

	controls.onAdd = function(map) {
		var controls = L.DomUtil.create('div', 'info controls'),
			labelYear = L.DomUtil.create('span', 'mapControls', controls),
			selectYear = L.DomUtil.create('select', 'mapControls', controls),
			labelMetric = L.DomUtil.create('span', 'mapControls', controls),
			selectMetric = L.DomUtil.create('select', 'mapControls', controls);

		if ( polygonType == 'hex' ) {
			var labelRes = L.DomUtil.create('span', 'mapControls', controls),
				selectRes = L.DomUtil.create('select', 'mapControls', controls);
			labelRes.innerHTML = 'Res.';
			selectRes.innerHTML = '<option value="low">Low</option>' +
				'<option value="medium">Medium</option>' +
				'<option value="high">High</option>';
			selectRes.setAttribute('id', 'selectRes');
		}

		var	sliderMonth = L.DomUtil.create('div', 'mapControls', controls),
			checkAnimate = L.DomUtil.create('div', 'mapControls', controls),
			dateOptions = '';

		var yearSelected;
		for ( var year in dates ) {
			yearSelected =  year == defaultYear ? 'selected="selected"' : '';
			dateOptions += '<option value="' + year + '"' + yearSelected +
				'>' + year + '</option>';
		}

		checkAnimate.innerHTML = '<input id="checkAnimate"' +
			'type="checkbox" />Animate map';
		
		sliderMonth.setAttribute('id', 'sliderMonth');
		// Prevent the entire map from dragging when the slider is dragged.
		L.DomEvent.disableClickPropagation(sliderMonth);

		labelYear.innerHTML = 'Year';
		selectYear.innerHTML = dateOptions;
		selectYear.setAttribute('id', 'selectYear');

		labelMetric.innerHTML = 'Metric';
		selectMetric.innerHTML = '<option value="download_median">' +
			'DL throughput</option><option value="upload_median">' +
			'UL throughput</option>';
		selectMetric.setAttribute('id', 'selectMetric');


		return controls;
	};

	controls.addTo(map);

	var elems;
	if ( polygonType != 'hex' ) {
		elems = [selectYear, selectMetric];
	} else {
		elems = [selectYear, selectMetric, selectRes];
	}
	elems.forEach( function(elem) {
		elem.addEventListener('change',
			function (e) { updateLayers(e, 'update'); });
	});

	var clearId;
	$('#checkAnimate').change( function() {
		if ( $('#checkAnimate').prop('checked') ) {
			$('.leaflet-control-layers').removeClass(
				"leaflet-control-layers-expanded");
			var i = $('#sliderMonth').slider('value');
			clearId = setInterval( function() {
				$('#sliderMonth').slider('value', i + 1);
				i = (i + 1) % dates[$('#selectYear').val()].length;
			}, animateInterval);
		} else {
			clearInterval(clearId);
			$('.leaflet-control-layers').addClass(
				"leaflet-control-layers-expanded");
		}
	});

	// Can't instantiate the slider until after "controls" is actually added to
	// the map.
	$('#sliderMonth')
		.slider({
			min: Number(dates[defaultYear][0]),
			max: Number(dates[defaultYear][dates[defaultYear].length - 1]),
			change: function (e, ui) {
				updateLayers(e, 'update');
			}
		})
		.slider('pips', {
			rest: 'label',
			labels: monthNames.slice(0, dates[defaultYear].length)
		});;
}

/**
 * Update the map when some event gets triggered that requires the map to
 * displays something else.
 *
 * @param {object} e Event object
 * @param {string" mode What state are we in? New or update?
 */
function updateLayers(e, mode) {
	var year = $('#selectYear').val(),
		metric = $('#selectMetric').val();

	var resolution = polygonType == 'hex' ? $('#selectRes').val() : '';

	// If the year was changed then we need to update the slider and set it's
	// value to the first configured month for that year.
	if ( e.target.id == 'selectYear' ) {
		$('#sliderMonth')
			.slider('option', 'min', Number(dates[year][0]))
			.slider('option', 'max', Number(
				dates[year][dates[year].length - 1]))
			.slider().slider('pips', {
				rest: 'label',
				labels: monthNames.slice(0, dates[year].length)
			});

		// This is a really ugly hack, but we don't want the onchange event to
		// fire when changing the slider value from within the updateLayers()
		// function, else changing the slider value actually triggers the
		// updateLayers() function to run a second time.  There must be a better
		// way to do this, but for now just remove the onchange event function,
		// change the value, then re-add it.
		$('#sliderMonth').slider('option', 'change', function(){return false;});
		$('#sliderMonth').slider('value', dates[year][0]);
		$('#sliderMonth').slider('option', 'change',
			function(e, ui){ updateLayers(e, 'update')});

		if ( seedCache ) {
			seedLayerCache(year);
		}
	}

	var month = $('#sliderMonth').slider('value');

	if ( overlays['polygon']['enabled'] ) {
		setPolygonLayer(year, month, metric, mode, resolution);
	}
	if ( overlays['plot']['enabled'] ) {
		setPlotLayer(year, month, mode);
	}
}

/**
 * Determines the color of a polygon based on a passed metric.
 *
 * @param {number} val Metric to evaluate
 * @returns {string} A string representing the color
 */
function getPolygonColor(val) {
    return val > 50 ? '#008000' : //'blue' :
           val > 25  ? '#24b323' : //'green' :
           val > 10  ? '#ffff00' : //'purple' :
           val > 5  ? '#ff5050' : // 'yellow' :
           val > 0   ? '#ff0000' : 'transparent'; //'red' : 'transparent';
}

/**
 * Fetches layer data from the server.
 *
 * @param {string} url URL where resource can be found
 * @param {function} callback Callback to pass server response to
 */
function getLayerData(url, callback) {
	if ( geoJsonCache[url] ) {
		console.log('Using cached version of ' + url);
		callback(geoJsonCache[url]);
	} else {
		console.log('Fetching and caching ' + url);
		$.get(url, function(resp) {
			// If we're dealing with a TopoJSON file, convert it to GeoJSON
			if ('topojson' == url.split('.').pop()) {
				var geojson = {
					'type': 'FeatureCollection',
					'features': null
				};
				geojson.features = omnivore.topojson.parse(resp);
				resp = geojson;
			}
			geoJsonCache[url] = resp;
			callback(resp);
		}, 'json');
	}
}

/**
 * Applies a layer to the map.
 *
 * @param {string} year Year of layer to set
 * @param {string} month Month of layer to set
 * @param {string} metric Metric to be represented in layer
 * @param {string" mode What state are we in? New or update?
 * @param {string} [resolution] For hexbinned map, granularity of hex layer
 */
function setPolygonLayer(year, month, metric, mode, resolution) {
	var polygonUrl;

	// Don't display spinner if animation is happening
	if ( $('#checkAnimate').prop('checked') === false ) {
		$('#spinner').css('display', 'block');
	}

	month = month < 10 ? '0' + month : month;
	if ( polygonType != 'hex' ) {
		polygonUrl = 'json/' + year + '_' + month + '-' + polygonType + '.' +
			jsonType;
	} else {
		polygonUrl = 'json/' + year + '_' + month + '-' + resolution + '.' +
			jsonType;
	}

	if ( mode == 'update' ) {
		layerCtrl.removeLayer(polygonLayer);
	}

	getLayerData(polygonUrl, function(response) {
		response.features.forEach( function(cell) {

			var value = cell.properties[metric],
				polygonStyle = cell.polygonStyle = {};

			polygonStyle.weight = 1;
			polygonStyle.fillOpacity = 0.5;

			if ( ! value ) {
				polygonStyle.weight = 0;
				polygonStyle.fillOpacity = 0;
			} else if ( metric == 'download_median' &&
					cell.properties['download_count'] < minDataPoints ) {
				polygonStyle.weight = 0.5;
				polygonStyle.fillOpacity = 0.05;
				polygonStyle.color = 'black';
			} else if ( metric == 'upload_median' &&
					cell.properties['upload_count'] < minDataPoints ) {
				polygonStyle.weight = 0.5;
				polygonStyle.fillOpacity = 0.05;
				polygonStyle.color = 'black';
			} else {
				polygonStyle.color = getPolygonColor(value);
			}
		});

		if ( map.hasLayer(polygonLayer) ) {
			map.removeLayer(polygonLayer);
			var polygonLayerVisible = true;
		}

		polygonLayer = L.geoJson(response).eachLayer( function(l) {
			if ( metric == "download_median" &&
					l.feature.properties.download_count > 0 ) {
				l.bindPopup(makePopup(l.feature.properties));
			}
			if ( metric == "upload_median" &&
					l.feature.properties.upload_count > 0 ) {
				l.bindPopup(makePopup(l.feature.properties));
			}
			l.setStyle(l.feature['polygonStyle']);
		});

		layerCtrl.addOverlay(polygonLayer, 'Polygon layer');

		if ( polygonLayerVisible || (mode == 'new' &&
				overlays['polygon']['defaultOn']) ) {
			map.addLayer(polygonLayer);
		}

	});

	$('#spinner').css('display', 'none');
}

/**
 * Applies a scatter plot layer to the map.
 *
 * @param {string} year Year of layer to set
 * @param {string} month Month of layer to set
 * @param {string" mode What state are we in? New or update?
 */
function setPlotLayer(year, month, mode) {

	// Don't display spinner if animation is happening
	if ( $('#checkAnimate').prop('checked') === false ) {
		$('#spinner').css('display', 'block');
	}

	month = month < 10 ? '0' + month : month;
	var plotUrl = 'json/' + year + '_' + month + '-plot.' + jsonType;

	if ( mode == 'update' ) {
		layerCtrl.removeLayer(plotLayer);
	}

	getLayerData(plotUrl, function(response) {
		if ( map.hasLayer(plotLayer) ) {
			map.removeLayer(plotLayer);
			var plotLayerVisible = true;
		}

		plotLayer = L.geoJson(response, {
			pointToLayer: function(feature, latlon) {
				return L.circleMarker(latlon, {
					radius: 1,
					fillColor: '#000000',
					fillOpacity: 1,
					stroke: false
				});
			}
		});

		layerCtrl.addOverlay(plotLayer, 'Plot layer');

		if ( plotLayerVisible ||
				(mode == 'new' && overlays['plot']['defaultOn']) ) {
			map.addLayer(plotLayer);
		}
	});

	$('#spinner').css('display', 'none');
}

/**
 * Takes a year and attempts to load the base layer date  into memory in the
 * background to speed switching between months for the current year.
 * 
 * @param {string} year Year of layer to seed cache for
 */
function seedLayerCache(year) {
	var months = dates[year].slice(1),
		url;
	for ( i = 0; i < months.length; i++ ) {
		month = months[i] < 10 ? '0' + months[i] : months[i];
		if ( polygonType != 'hex' ) {
			url = 'json/' + year + '_' + month + '-' + polygonType +
				'.' + jsonType;
		} else {
			url = 'json/' + year + '_' + month + '-low.' + jsonType;
		}
		getLayerData(url, function(){ return false; });
	}
}

/**
 * Creates a popup with information about a polygon.
 *
 * @param {object} props Properties for a polygon
 * @returns {string} Textual information for the popup
 */
function makePopup(props) {
	var popup = 'DL: median:' + Math.round(props.download_median * 10) / 10 +
		' Mbps / mean:' + Math.round(props.download_avg * 10) / 10 +
		' Mbps / pts:' + Math.round(props.download_count * 10) / 10 +
		'<br/>UL: median:' + Math.round(props.upload_median * 10) / 10 +
		' Mbps / mean:' + Math.round(props.upload_avg * 10) / 10 + ' Mbps' +
		' / pts:' + Math.round(props.upload_count * 10) / 10 + '<br/>' +
		'RTT (mean): ' + Math.round(props.rtt_avg) + ' ms';
	return popup;
}
