/*
 * Copyright 2014 University of California, Berkeley.
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

    var fs = require('fs');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function mergeIntoAllData(location2TypeHistogram, allLocation2TypeHistogram) {
        for (var location in location2TypeHistogram) {
            var typeHistogram = location2TypeHistogram[location];
            var allTypeHistogram = allLocation2TypeHistogram[location] || {};
            for (var type in typeHistogram) {
                var nb = typeHistogram[type];
                var oldNb = allTypeHistogram[type] || 0;
                allTypeHistogram[type] = oldNb + nb;
            }
            allLocation2TypeHistogram[location] = allTypeHistogram;
        }
    }

    function analyze(results) {
        var allLocation2TypeHistogram = {}; // string --> (string --> number)

        // merge all results
        results.forEach(function(result) {
            var location2TypeHistogram = result.value;
            mergeIntoAllData(location2TypeHistogram, allLocation2TypeHistogram);
        });

        var ignoredSingleType = 0;
        var multiType = 0;
        for (var location in allLocation2TypeHistogram) {
            var histogram = allLocation2TypeHistogram[location];
            if (Object.keys(histogram).length === 1)
                ignoredSingleType++;
            else {
                console.log(location + ":");
                console.log(toSortedString(histogram));
                multiType++;
            }
        }
        console.log("\nTotal: " + multiType + " + " + ignoredSingleType + " locations with only a single type");
    }

    function toSortedString(histogram) {
        var pairs = [];
        for (var type in histogram) {
            var nb = histogram[type];
            pairs.push({type:type, nb:nb});
        }
        var sortedPairs = pairs.sort(function(a, b) {
            return b.nb - a.nb;
        });
        var result = "";
        sortedPairs.forEach(function(p) {
            result += "  " + p.type + " --> " + p.nb + "\n";
        });
        return result;
    }

    // main part
    var results = readFile(process.argv[2]);
    analyze(results);

})();