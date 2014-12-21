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

    var plotsDir = "/home/m/research/papers/ecoop15/graphs/";

    var util = require("./CommonUtil.js");
    var fs = require('fs');
    var nbBasic = require('numbers').basic;
    var nbStats = require('numbers').statistic;
    var m = require('./Mappers.js');
    var r = require('./Reducers.js');

    function plotHistogram(histogram, filename, yLabel, options) {
        var entries = [];
        Object.keys(histogram).forEach(function(x) {
            entries.push({x:x, y:histogram[x]});
        });
        if (options && options.order) {
            entries.sort(function(a, b) {
                return options.order.indexOf(a.x) - options.order.indexOf(b.x);
            });
        } else {
            entries.sort(function(a, b) {
                return b.y - a.y;
            });
        }
        if (options && options.maxValues && entries.length > options.maxValues) {
            if (options.maxValues % 2 !== 0) throw "Need even maxValues";
            var firstOnes = entries.slice(0, options.maxValues / 2);
            var others = entries.slice(options.maxValues / 2, entries.length - (options.maxValues / 2));
            var lastOnes = entries.slice(entries.length - (options.maxValues / 2));
            var yOfOthers;
            if (options.toPercentages) {
                yOfOthers = others.reduce(r.xy.addY, 0);
            } else {
                yOfOthers = util.avgOfArray(others.map(m.xy.toY));
            }
            entries = firstOnes;
            entries.push({x:"Others", y:yOfOthers});
            entries = entries.concat(lastOnes);
        }

        // .dat
        var total = totalOfHistogram(histogram);
        var data = "";
        var maxY = 0;
        entries.forEach(function(entry, idx) {
            var y = (options && options.toPercentages) ? Math.round((entry.y / total) * 10000) / 100 : entry.y;
            data += idx + " \"" + entry.x + "\" " + y + "\n";
            maxY = Math.max(maxY, y);
        });
        fs.writeFileSync(plotsDir + filename + ".dat", data);

        // .plot
        var xLabel = options && options.xLabel ? options.xLabel : "";
        var yRange = "0:" + (maxY + 0.1 * maxY);
        var templateFile = (options && options.values) ? "histogram_with_values_template.plot_" : "histogram_template.plot_";
        var plotTemplate = fs.readFileSync(plotsDir + templateFile, {encoding:"utf8"});
        var dimensions = (options && options.wide) ? "1.0,0.6" : "0.6,0.6";
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, yLabel).replace(/XLABEL/g, xLabel).replace(/YRANGE/g, yRange).replace(/DIMENSIONS/g, dimensions);
        fs.writeFileSync(plotsDir + filename + ".plot", plot);
    }

    function totalOfHistogram(histogram) {
        var total = 0;
        Object.keys(histogram).forEach(function(x) {
            total += histogram[x];
        });
        return total;
    }

    function plotBoxAndWhisker(xToValues, filename, yLabel) {
        // .dat
        var data = "";
        var maxY = 0;
        Object.keys(xToValues).forEach(function(group, idx) {
            var values = xToValues[group].sort();
            var min = nbBasic.min(values);
            var lower = nbStats.quantile(values, 1, 4);
            var median = nbStats.median(values);
            var upper = nbStats.quantile(values, 3, 4);
            var max = nbBasic.max(values);
            data += idx + " " + group + " " + min + " " + lower +
            " " + median + " " + upper + " " + max + "\n";
            maxY = Math.max(maxY, max);
        });
        fs.writeFileSync(plotsDir + filename + ".dat", data);

        // .plot
        var plotTemplate = fs.readFileSync(plotsDir + "box_whisker_template.plot_", {encoding:"utf8"});
        var xRange = "-1:" + (Object.keys(xToValues).length);
        var yRange = "0:" + (maxY + maxY * 0.1);
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, yLabel).replace(/YRANGE/g, yRange).replace(/XRANGE/g, xRange);
        fs.writeFileSync(plotsDir + filename + ".plot", plot);
    }

    function CategoryData() {
        this.groupNames = []; // invariant: same length as categoryToValue
        this.categoryToValue = []; // invariant: same length as groupNames
    }

    CategoryData.prototype = {
        addGroup:function(groupName, categoryNames, categoryToValue) {
            this.groupNames.push(groupName);
            this.categoryNames = categoryNames;
            this.categoryToValue.push(categoryToValue);
        }
    }

    function plotCategories(categoryData, filename, yLabel) {
        var dimensions = "0.9,0.6";

        // .data
        var data = "";
        var maxY = 0;
        // first row (category titles)
        var categories = Object.keys(categoryData.categoryToValue[0]);
        data += "Group ";
        for (var i = 0; i < categories.length; i++) {
            data += "\"" + categories[i] + "\" ";
        }
        data += "\n";
        // other rows (actual data)
        for (i = 0; i < categoryData.groupNames.length; i++) {
            var groupName = categoryData.groupNames[i];
            var categoryToValue = categoryData.categoryToValue[i];
            data += "\"" + groupName + "\" ";
            for (var j = 0; j < categoryData.categoryNames.length; j++) {
                var categoryName = categoryData.categoryNames[j];
                var value = categoryToValue[categoryName];
                maxY = Math.max(maxY, value);
                data += value + " ";
            }
            data += "\n";
        }
        fs.writeFileSync(plotsDir + filename + ".dat", data);

        // .plot
        var plotTemplate = fs.readFileSync(plotsDir + "categories_template.plot_", {encoding:"utf8"});
        var yRange = "0:" + (maxY + 0.1 * maxY);
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, yLabel).replace(/YRANGE/g, yRange).replace(/DIMENSIONS/g, dimensions);
        fs.writeFileSync(plotsDir + filename + ".plot", plot);
    }

    function stringsToHistogram(arrayOfStrings) {
        var histo = {};
        for (var i = 0; i < arrayOfStrings.length; i++) {
            var s = arrayOfStrings[i];
            var oldFreq = histo[s] || 0;
            histo[s] = oldFreq + 1;
        }
        return histo;
    }

    function strAndFreqsToHistogram(strAndFreqs) {
        var histo = {};
        for (var i = 0; i < strAndFreqs.length; i++) {
            var sf = strAndFreqs[i];
            var oldFreq = histo[sf.str] || 0;
            histo[sf.str] = oldFreq + sf.freq;
        }
        return histo;
    }

    exports.stringsToHistogram = stringsToHistogram;
    exports.strAndFreqsToHistogram = strAndFreqsToHistogram;
    exports.plotHistogram = plotHistogram;
    exports.plotBoxAndWhisker = plotBoxAndWhisker;
    exports.plotCategories = plotCategories;
    exports.CategoryData = CategoryData;

})
();