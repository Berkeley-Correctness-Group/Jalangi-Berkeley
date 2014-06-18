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

    var fs = require('fs');
    var exec = require('execSync').exec;

    var configs = {
        none:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        filterStructuralSubtypesOnly:{
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        filterByBeliefsOnly:{
            filterStructuralSubtypes:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        filterNullRelatedOnly:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        filterByNbTypesOnly:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        filterByNbTypeDiffEntries:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        mergeViaDataflowOnly:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeByTypeDiff:false,
            mergeSameArray:false
        },
        mergeByTypeDiffOnly:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeSameArray:false
        },
        mergeSameArrayOnly:{
            filterStructuralSubtypes:false,
            filterByBeliefs:false,
            filterNullRelated:false,
            filterByNbTypes:false,
            filterByNbTypeDiffEntries:false,
            mergeViaDataflow:false,
            mergeByTypeDiff:false
        },
        allButFilterStructuralSubtypes:{
            filterStructuralSubtypes:false
        },
        allButFilterByBeliefs:{
            filterByBeliefs:false
        },
        allButFilterNullRelated:{
            filterNullRelated:false
        },
        allButFilterByNbTypes:{
            filterByNbTypes:false
        },
        allButFilterByNbTypeDiffEntries:{
            filterByNbTypeDiffEntries:false
        },
        allButMergeViaDataflow:{
            mergeViaDataflow:false
        },
        allButMergeByTypeDiff:{
            mergeByTypeDiff:false
        },
        allButMergeSameArray:{
            mergeSameArray:false
        },
        allNbTypes3:{
            filterByNbTypes:3
        },
        allNbTypes4:{
            filterByNbTypes:4
        },
        allNbTypeDiffEntries3:{
            filterByNbTypeDiffEntries:3
        },
        allNbTypeDiffEntries4:{
            filterByNbTypeDiffEntries:4
        },
        all:{}
    };

    var bmSets = ["sunspider", "octane", "webapps"];

    var configToNbWarnings = {};

    function analyzeConfig(configKey) {
        var config = configs[configKey];
        fs.writeFileSync("filterAndMergeConfig.json", JSON.stringify(config));

        var totalNbWarnings = 0;
        bmSets.forEach(function(bmSet) {
            var cmd = "./scripts/inconsistent_type_analysis_" + bmSet + "_offline.sh";
            console.log(cmd);
            var result = exec(cmd);
            console.log("Done with " + cmd);
            fs.writeFileSync("out_" + bmSet + "_" + configKey, result.stdout);
            result.stdout.split("\n").forEach(function(line) {
                if (line.indexOf("ResultSummary: ") === 0) {
                    var csv = line.slice("ResultSummary: ".length);
                    var values = csv.split(",");
                    if (values.length !== 6)
                        throw "Unexpected result summary: " + csv;
                    var nbWarnings = parseFloat(values[4]);
                    totalNbWarnings += nbWarnings;
                }
            });
        });

        configToNbWarnings[configKey] = totalNbWarnings;
        console.log("CONFIG_RESULT: " + configKey + "," + totalNbWarnings);
    }

    function printTable() {
        var keyToDescription = {
            filterStructuralSubtypes:"Pruning of structural subtypes",
            filterByBeliefs:"Pruning by belief analysis",
            filterNullRelated:"Pruning of null-related warnings",
            filterByNbTypes:"Pruning by degree of inconsistency",
            filterByNbTypeDiffEntries:"Prune by size of type diff",
            mergeViaDataflow:"Merge by dataflow relations",
            mergeByTypeDiff:"Merge by type diff",
            mergeSameArray:"Merge by array type"
        };

        // create columns
        var columns = [];
        var firstColumn = ["Technique"];
        Object.keys(keyToDescription).forEach(function(key) {
            firstColumn.push(key);
        });
        firstColumn.push("Reported inconsistencies &");
        columns.push(firstColumn);

        var maxWarnings = Number.MIN_VALUE;
        Object.keys(configToNbWarnings).forEach(function(configKey) {
            if (configToNbWarnings[configKey] > maxWarnings)
                maxWarnings = configToNbWarnings[configKey];
        });

        Object.keys(configToNbWarnings).forEach(function(configKey) {
            var config = configs[configKey];
            var column = [""];
            for (var i = 1; i < firstColumn.length - 1; i++) {
                if (config[firstColumn[i]] !== undefined && config[firstColumn[i]]) {
                    if (typeof config[firstColumn[i]] === "boolean")
                        column.push(config[firstColumn[i]] ? "y&" : "n&");
                    else
                        column.push(config[firstColumn[i]] + "&");
                } else {
                    column.push("y&");
                }
            }
//            var percentage = Math.round(100 * configToNbWarnings[configKey] / maxWarnings);
//            column.push(percentage+"&");
            column.push(configToNbWarnings[configKey]+"&");
            columns.push(column);
        });

        // replace keys by description of technique
        for (var i = 1; i < firstColumn.length - 1; i++) {
            var key = columns[0][i];
            columns[0][i] = keyToDescription[key] + " &";
        }

        // print row by row
        var result = "";
        for (var rowIdx = 0; rowIdx < columns[0].length; rowIdx++) {
            columns.forEach(function(column) {
                result += column[rowIdx];
            });
            result += "\n";
        }
        console.log();
        console.log(result);
    }

    Object.keys(configs).forEach(analyzeConfig.bind(null));
    printTable();


})();