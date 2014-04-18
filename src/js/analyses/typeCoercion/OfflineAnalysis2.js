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
    var offlineCommon = require('../OfflineAnalysesCommon.js');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function mergeIntoAllData(location2TypePairs, allLocation2TypePairs) {
        for (var location in location2TypePairs) {
            var typePairs = location2TypePairs[location];
            var allTypePairs = allLocation2TypePairs[location] || [];
            allTypePairs.push.apply(allTypePairs, typePairs);
            allLocation2TypePairs[location] = allTypePairs;
        }
    }

    function analyze(results, iids) {
        var allLocation2TypePairs = {}; // string --> array of TypePairs

        // merge all results
        results.forEach(function(result) {
            var location2TypePairs = result.value;
            mergeIntoAllData(location2TypePairs, allLocation2TypePairs);
        });

        var opToLocAndHistos = {}; // string --> array of [string, string --> nb]
        for (var opAndLocation in allLocation2TypePairs) {
            var typePairs = allLocation2TypePairs[opAndLocation];
            var splitted = opAndLocation.split(" at ");
            if (splitted.length !== 2)
                throw "Illegal location: " + opAndLocation;
            var op = splitted[0];
            var locationRaw = splitted[1];
            var location = iids[locationRaw];
            var histogram = toHistogram(typePairs, op);
            var locAndHistos = opToLocAndHistos[op] || [];
            locAndHistos.push([location, histogram]);
            opToLocAndHistos[op] = locAndHistos;
        }

        // print, grouped by operation
        for (var op in opToLocAndHistos) {
            var locAndHistos = opToLocAndHistos[op];
            console.log("-----------------------------\nOperation: " + op + "\n");
            locAndHistos.forEach(function(locAndHisto) {
                console.log(locAndHisto[0]);
                var histo = locAndHisto[1];
                for (var pair in histo) {
                    console.log("   " + pair + "    (" + histo[pair] + "x)");
                }
                console.log();
            });
            console.log();
        }

        // print detailed output
        console.log("\n===== Details: =====");
        for (var opAndLocation in allLocation2TypePairs) {
            var typePairs = allLocation2TypePairs[opAndLocation];
            var splitted = opAndLocation.split(" at ");
            if (splitted.length !== 2)
                throw "Illegal location: " + opAndLocation;
            var op = splitted[0];
            console.log("\n-----------------------");
            console.log(opAndLocation + ":");
            typePairs.forEach(function(typePair) {
                console.log("------");
                console.log("  values: " + typePair.leftValue + " " + op + " " + typePair.rightValue + " --> " + typePair.resultValue);
                console.log("  types: " + typePair.leftType + " " + op + " " + typePair.rightType + " --> " + typePair.resultType);
                console.log(typePair.stackTrace);
            });
        }
    }

    function toHistogram(typePairs, op) {
        var result = {};
        typePairs.forEach(function(p) {
            var s = p.leftType + " " + op + " " + p.rightType;
            var oldNb = result[s] || 0;
            result[s] = oldNb + 1;
        });
        return result;
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
    var sourcemapDir = process.argv[3];
    var iids = offlineCommon.loadIIDs(sourcemapDir);
    analyze(results, iids);
})();