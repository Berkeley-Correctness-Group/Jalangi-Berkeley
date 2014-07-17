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

    function plotHistogram(histogram, filename, ylabel) {
        var plotTemplate = fs.readFileSync(plotsDir + "histogram_template.plot_", {encoding:"utf8"});
        var plot = plotTemplate.replace(/FILENAME/g, filename).replace(/YLABEL/g, ylabel).replace(/YRANGE/g, "1:100");
        fs.writeFileSync(plotsDir + filename + ".plot", plot);

        var total = totalOfHistogram(histogram);
        var data = "";
        var i = 0;
        Object.keys(histogram).forEach(function(x) {
            var percentage = Math.round((histogram[x] / total) * 10000) / 100;
            data += i + " \"" + x + "\" " + percentage + "\n";
            i++;
        });
        fs.writeFileSync(plotsDir + filename + ".dat", data);
    }

    function totalOfHistogram(histogram) {
        var total = 0;
        Object.keys(histogram).forEach(function(x) {
            total += histogram[x];
        });
        return total;
    }

    exports.plotHistogram = plotHistogram;

})();