/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    var plotsDir = "/home/m/research/thinking_by_writing/type_coercions/graphs/";
    var fs = require('fs');
    var nbBasic = require('numbers').basic;
    var nbStats = require('numbers').statistic;

    function plotHistogram(histogram, filename, ylabel, options) {
        var entries = [];
        Object.keys(histogram).forEach(function(x) {
            entries.push({x:x, y:histogram[x]});
        });
        entries.sort(function(a, b) {
            return b.y - a.y;
        });

        // .dat
        var total = totalOfHistogram(histogram);
        var data = "";
        var maxPerc = 0;
        entries.forEach(function(entry, idx) {
            var percentage = Math.round((entry.y / total) * 10000) / 100;
            data += idx + " \"" + entry.x + "\" " + percentage + "\n";
            maxPerc = Math.max(maxPerc, percentage);
        });
        fs.writeFileSync(plotsDir + filename + ".dat", data);

        // .plot
        var yRange = "0:" + (maxPerc + 5);
        var templateFile = (options && options.values) ? "histogram_with_values_template.plot_" : "histogram_template.plot_";
        var plotTemplate = fs.readFileSync(plotsDir + templateFile, {encoding:"utf8"});
        var dimensions = (options && options.wide) ? "1.2,0.6" : "0.6,0.6";
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, ylabel).replace(/YRANGE/g, yRange).replace(/DIMENSIONS/g, dimensions);
        fs.writeFileSync(plotsDir + filename + ".plot", plot);
    }

    function totalOfHistogram(histogram) {
        var total = 0;
        Object.keys(histogram).forEach(function(x) {
            total += histogram[x];
        });
        return total;
    }

    function plotBoxAndWhisker(xToValues, filename, ylabel) {
        // .dat
        var data = "";
        var maxY = 0;
        Object.keys(xToValues).forEach(function(group, idx) {
            var values = xToValues[group].sort();
            var min = toPerc(nbBasic.min(values));
            var lower = toPerc(nbStats.quantile(values, 1, 4));
            var median = toPerc(nbStats.median(values));
            var upper = toPerc(nbStats.quantile(values, 3, 4));
            var max = toPerc(nbBasic.max(values));
            data += idx + " " + group + " " + min + " " + lower +
                  " " + median + " " + upper + " " + max + "\n";
            maxY = Math.max(maxY, max);
        });
        fs.writeFileSync(plotsDir + filename + ".dat", data);

        // .plot
        var plotTemplate = fs.readFileSync(plotsDir + "box_whisker_template.plot_", {encoding:"utf8"});
        var xrange = "-1:" + (Object.keys(xToValues).length);
        var yrange = "0:" + (maxY + 5);
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, ylabel).replace(/YRANGE/g, yrange).replace(/XRANGE/g, xrange);
        fs.writeFileSync(plotsDir + filename + ".plot", plot);
    }

    function toPerc(frac) {
        return Math.round(frac * 10000) / 100;
    }

    exports.plotHistogram = plotHistogram;
    exports.plotBoxAndWhisker = plotBoxAndWhisker;

})();