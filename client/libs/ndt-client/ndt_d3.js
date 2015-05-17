/*jslint bitwise: true, browser: true, nomen: true, vars: true */
/*global Uint8Array, d3 */

'use strict';

function NDTmeter(body_element) {
    this.meter = undefined;
    this.arc = undefined;
    this.state = undefined;
    this.body_element = body_element;
    this.time_switched = undefined;

    this.url_path = '/ndt_protocol';
    this.server_port = 3001;

    this.callbacks = {
        'onstart': this.onstart,
        'onstatechange': this.onstatechange,
        'onprogress': this.onprogress,
        'onfinish': this.onfinish,
        'onerror': this.onerror
    };

    this.NDT_STATUS_LABELS = {
        'preparing_s2c': 'Preparing Download',
        'preparing_c2s': 'Preparing Upload',
        'running_s2c': 'Measuring Dnload',
        'running_c2s': 'Measuring Upload',
        'finished_s2c': 'Finished Download',
        'finished_c2s': 'Finished Upload',
        'preparing_meta': 'Preparing Metadata',
        'running_meta': 'Sending Metadata',
        'finished_meta': 'Finished Metadata',
        'finished_all': 'Run Again'
    };

    this.create();
}

NDTmeter.prototype.update_display = function (status, information) {
    d3.select('text.status').text(status);
    d3.select('text.information').text(information);
    return;
};

NDTmeter.prototype.create = function () {

    var width = d3.select(this.body_element).style("width").replace(/px/, '');
    var height = d3.select(this.body_element).style("height").replace(/px/, '');
    var twoPi = 2 * Math.PI;
    var innerRad = (width * 0.30);
    var outerRad = (width * 0.37);

    var svg = d3.select(this.body_element).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

//jft:

    // fill the circle
    svg.append('circle')
      .attr('r', innerRad)
      .attr('fill', '#E0E0E0')
      .attr('id', 'headCircle');

    svg.append('defs')
      .append('clipPath')
        .attr('id', 'headCircle')
        .append('circle')
          .attr('cx', '337.5')
          .attr('cy', '281.5')
          .attr('r', '55');

    // Chief Seattle's Head
    var head = svg.append('g')
      .attr('transform','scale(2.1,2.1)')
      .append('g')
        //.attr("transform", "translate(" + width / -1.5  + "," + height / -1.5  + ")")
        .attr("transform", "translate(-337.5,-281.5)")
        .attr('fill', '#00839a')
        .attr('fill-opacity', '0.10')
        .attr('clip-path', 'url(#headCircle)');

    head.append('path')
      .attr('d', 'm 353,226 10,0 0,110 -10,0 0,-110 z')
      .attr('fill', '#00839a');

    head.append('path')
      .attr('fill', '#00839a')
      .attr('d', 'm 335,226 c 0,18 3,32 16.07143,40.03571 l -0.0893,17.94643 C 338,274 329.12789,259.53877 329,241 c 0,-2 -3,-1 -5,0 -2,0 -9,8 -12,11 -1,1 -3,1 -3,3 0,2 3,2 7,4 2,1 5.875,3.19643 6.14286,3.82143 C 322.41072,263.44643 322,265 319,266 c -3,1 -2,-2 -4,-1 -2,1 -2,2 -3,4 -1,2 -3,2 -4,1 -1,-1 1,-1.33636 1,-4 0,-3 -0.64886,-4 -2,-4 -1,0 -1.55279,-0.34164 -2,1 -1,3 -2.42559,4.00992 -3,5 -1.12211,1.93413 -2.29001,4.58002 -3,6 -1,2 -2,2 -2,3 0,3 5.14286,2.16071 5.14286,2.16071 l -2.05357,4.55357 3.21428,2.85715 L 300,288 c 0,0 2,1 2,5 0,2 -2,3 -2,6 0,5 4,6 6,5 2,-1 10.0621,-1 13,-1 7,0 12,-2 12,-6 0,-9 3,-18 3,-24 l 5,6 0,39 c 0,7 -3,16 -7,20 l -12,0 c 7.25332,-5.62294 11,-12.02563 11,-21 0,-2 -2,-8 -5,-8 0,0 -15,0 -15,0 0,0 2,0 2,3 0,1 0,3 2,5 2,2 3,4 3,6 0,2 1,3 1,4 0,4 -1,7 -5,11 l -33,0 0,-112 c 18,0 36,0 54,0 z');
    head.append('path')
      .attr('d', 'm 342,282 9,7 0,49 -14,0 c 3,-5 5,-11 5,-18 0,0 0,-38 0,-38 z');
    head.append('path')
        .attr('d', 'm 348,226 c 0,11 0,24 3,35 -11,-5 -14,-26 -14,-35');
    head.append('path')
        .attr('d', 'm 392,252 c 0,0 0,45 0,45 -3,-20 -14,-41 -27,-46 0,0 0,-25 0,-25');
    head.append('path')
        .attr('d', 'm 365,254 c 14,5 25,40 25,49 l -10,18 c 0,-17 -4,-47 -15,-56 l 0,-11');
    head.append('path')
        .attr('d', 'm 365,269 c 11,12 12,47 12,54 l -12,9 z');        

    var gradient = svg
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("gradientUnits", "userSpaceOnUse");

    gradient
        .append("stop")
        .attr("offset", "0")
        .attr("stop-color", "#ABE5CC");
    gradient
        .append("stop")
        .attr("offset", "0.5")
        .attr("stop-color", "#90C1AC");

    this.arc = d3.svg.arc()
        .startAngle(0)
        .endAngle(0)
        .innerRadius(innerRad)
        .outerRadius(outerRad);
    this.meter = svg.append("g")
        .attr("id", "progress-meter")
        .attr("fill", "url(#gradient)");
    this.meter.append("path")
        .attr("class", "background")
        .attr("d", this.arc.endAngle(twoPi));
    this.meter.append("path").attr("class", "foreground");
    this.meter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0em")
        .attr("class", "information")
        .text("Initializing");

    this.reset_meter();
    this.update_display('Start Test', '');

    d3.selectAll("#progress-meter text").classed("ready", true);
    d3.selectAll("#progress-meter .foreground").classed("complete", false);
    d3.selectAll("#progress-meter").classed("progress-error", false);

    return;
};

NDTmeter.prototype.onstart = function (server) {
    var _this = this;
    var meter_movement = function () {
        _this.meter_movement();
    };

    this.server_name = server.replace('.measurement-lab.org', '');
    this.reset_meter();
    this.update_display('Connecting', this.server_name);

    d3.timer(meter_movement);
};

NDTmeter.prototype.onstatechange = function (returned_message) {
    this.state = returned_message;
    this.time_switched = new Date().getTime();
    this.update_display(this.NDT_STATUS_LABELS[returned_message], '');
};

NDTmeter.prototype.onprogress = function (returned_message, passedResults) {
    var throughputRate;
    var progress_label = this.NDT_STATUS_LABELS[this.state];

    if (returned_message === "interval_s2c" && this.state === "running_s2c") {
        throughputRate = passedResults.s2cRate;
    } else if (returned_message === "interval_c2s" &&
            this.state === "running_c2s") {
        throughputRate = passedResults.c2sRate;
    }

    if (throughputRate !== undefined) {
        this.update_display(progress_label,
            ((throughputRate / 1000).toFixed(2) + " mbps"));
    }
};

NDTmeter.prototype.onfinish = function (passed_results) {
    var result_string,
        dy_current,
        metric_name;
    var dy_offset = 1.55;
    var iteration = 0;
    var results_to_display = {
        's2cRate': 'Download',
        'c2sRate': 'Upload',
        'MinRTT': 'Latency'
    };

    for (metric_name in results_to_display) {
        if (results_to_display.hasOwnProperty(metric_name)  &&
                passed_results.hasOwnProperty(metric_name)) {

            if (metric_name !== 'MinRTT') {
                result_string = Number(passed_results[metric_name] /
                    1000).toFixed(2);
                result_string += ' Mbps';
            } else {
                result_string = Number(passed_results[metric_name]).toFixed(2);
                result_string += ' ms';
            }

            dy_current = dy_offset * (iteration + 1);
            this.meter.append("text")
                .attr("class", "result_value")
                .attr("text-anchor", "left")
                .attr("dy", dy_current + "em")
                .attr("dx", ".5em")
                .attr('width', '400px')
                .text(result_string);

            this.meter.append("text")
                .attr("class", "result_label")
                .attr("text-anchor", "right")
                .attr("dy", dy_current + "em")
                .attr("dx", "-5em")
                .attr('width', '400px')
                .text(results_to_display[metric_name]);
            iteration += 1;
        }
    }

    d3.selectAll("#progress-meter .foreground").classed("complete", true);
    d3.selectAll("#progress-meter text.status").attr("dy", "-50px");
    d3.selectAll("#progress-meter text.information").attr("dy", "-20px");
};

NDTmeter.prototype.onerror = function (error_message) {
    d3.timer.flush();
    d3.selectAll("#progress-meter").classed("progress-error", true);
    this.update_display('Error!', error_message);
};

NDTmeter.prototype.reset_meter = function () {
    d3.selectAll('#progress-meter text').remove();

    this.meter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0em")
        .attr("class", "status");
    this.meter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.55em")
        .attr("class", "information");

    d3.selectAll('.result_value, .result_label').remove();
    d3.select('#progress-meter').classed('progress-complete', false);
    d3.selectAll("#progress-meter text").classed("ready", true);
    return;
};

NDTmeter.prototype.meter_movement = function () {
    var end_angle,
        start_angle,
        progress_percentage;
    var origin = 0;
    var progress = 0;
    var twoPi = 2 * Math.PI;
    var time_in_progress = new Date().getTime() - this.time_switched;

    if (this.state === "running_s2c" || this.state === "running_c2s") {

        progress_percentage = (time_in_progress < 10000) ?
                (time_in_progress / 10000) : 1;
        progress = twoPi * progress_percentage;

/* pre-jft:        if (this.state === "running_c2s") { */
        if (this.state !== "running_c2s") {
            progress = twoPi + -1 * progress;
            end_angle = this.arc.endAngle(twoPi);
            start_angle = this.arc.startAngle(progress);
        } else {
            end_angle = this.arc.endAngle(progress);
            start_angle = this.arc.startAngle(origin);
        }
    } else if (this.state === "finished_all") {
        end_angle = this.arc.endAngle(twoPi);
        start_angle = this.arc.startAngle(origin);
    } else {
        end_angle = this.arc.endAngle(origin);
        start_angle = this.arc.startAngle(origin);
    }
    d3.select('.foreground').attr("d", end_angle);
    d3.select('.foreground').attr("d", start_angle);

    if (this.state === 'finished_all') {
        return true;
    }

    return false;
};
