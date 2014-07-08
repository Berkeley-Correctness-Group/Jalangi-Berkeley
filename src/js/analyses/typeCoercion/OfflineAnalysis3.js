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
    var util = require("./CommonUtil.js");
    var offlineCommon = require('../OfflineAnalysesCommon.js');
    function mergeObs(bmDirs) {
        var allHashToObs = {};
        var allHashToFreq = {};
        bmDirs.forEach(function(bmDir) {
            var analysisResultsRaw = fs.readFileSync(bmDir + "/analysisResults.json");
            var analysisResults = JSON.parse(analysisResultsRaw);
            var iids = offlineCommon.loadIIDs(bmDir + "/sourcemaps/");
            var bm = bmDir.split("/")[bmDir.split("/").length - 1];
            analysisResults.forEach(function(analysisResult) {
                var hashToObs = analysisResult.value.hashToObservations;
                var hashToFreq = analysisResult.value.hashToFrequency;
                Object.keys(hashToObs).forEach(function(hash) {
                    if (util.HOP(allHashToObs, hash)) {
                        console.log("Hash collision! Ignoring observation with hash " + hash + " from " + bmDir);
                    } else {
                        var obs = hashToObs[hash];
                        obs.location = obs.operation + " at " + iids[obs.iid] + "(" + obs.iid + ") of " + bm;  // unique identifier of source code location
                        allHashToObs[hash] = hashToObs[hash];
                        allHashToFreq[hash] = hashToFreq[hash];
                    }
                });
            });
        });
        return [allHashToObs, allHashToFreq];
    }

    /*
     * String description of the coercion (or "none").
     */
    function coercionOfObservation(obs) {
        var op = obs.operation;
        if (obs.kind === "explicit") {
            return "none";
        }
        if (obs.kind === "conditional") {
            if (obs.type === "boolean") {
                return "none";
            } else {
                return obs.type + " in conditional";
            }
        } else if (obs.kind === "unary") {
            if (op === "+" || op === "-") {
                if (obs.type === "number") {
                    return "none";
                } else {
                    return op + " " + obs.type;
                }
            } else if (op === "~") {
                if (obs.type === "number") {
                    return "none";
                } else {
                    return op + " " + obs.type;
                }
            } else if (op === "!") {
                if (obs.type === "boolean") {
                    return "none";
                } else {
                    return op + " " + obs.type;
                }
            }
        } else if (obs.kind === "binary") {
            if (op === "-" || op === "*" || op === "/" || op === "%" ||
                  op === "<<" || op === ">>" || op === ">>>") {
                if (obs.leftType === "number" && obs.rightType === "number") {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            } else if (op === "+") {
                if ((obs.leftType === "number" && obs.rightType === "number") ||
                      (obs.leftType === "string" && obs.rightType === "string")) {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            } else if (op === "<" || op === ">" || op === "<=" || op === ">=") {
                if ((obs.leftType === "number" && obs.rightType === "number") ||
                      (obs.leftType === "string" && obs.rightType === "string")) {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            } else if (op === "==" || op === "!=" || op === "===" || op === "!==") {
                if (obs.leftType === obs.rightType) {
                    return "none";
                } else if ((obs.leftType === "null" && obs.rightType === "undefined") ||
                      (obs.leftType === "undefined" && obs.rightType === "null")) {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            } else if (op === "&" || op === "^" || op === "|") {
                if (obs.leftType === "number" && obs.rightType === "number") {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            } else if (op === "&&" || op === "||") {
                if (obs.leftType === "boolean" && obs.rightType === "boolean") {
                    return "none";
                } else {
                    return obs.leftType + " " + op + " " + obs.rightType;
                }
            }
        }
        throw "Unexpected operation-type combination: " + JSON.stringify(obs);
    }

    function typesOfObservation(obs) {
        var types = [];
        if (util.HOP(obs, "type")) { // unary and conditional
            types.push(obs.type);
        } else { // binary
            types.push(obs.leftType);
            types.push(obs.rightType);
        }
        return types;
    }

    function typesAndOperators(obsAndFreq) {
        var hashToObservations = obsAndFreq[0];
        var typesAndOps = {}; // string --> true
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var s;
                if (obs.kind === "binary") {
                    s = obs.leftType + " " + obs.operation + " " + obs.leftType;
                } else { // conditional or unary
                    s = obs.operation + " " + obs.type;
                }
                typesAndOps[s] = true;
            }
        });
        Object.keys(typesAndOps).forEach(function(s) {
            console.log(s);
        });
    }

    function prevalenceOfCoercions(obsAndFreq) {
        console.log("\n====== Prevalence of type coercions (dynamic) ======\n");
        var hashToObservations = obsAndFreq[0];
        var hashToFrequency = obsAndFreq[1];
        var conditionalCoercionToFreq = {};
        var unaryCoercionToFreq = {};
        var binaryCoercionToFreq = {};
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var coercion = coercionOfObservation(obs);
                var map = obs.kind === "conditional" ? conditionalCoercionToFreq : (obs.kind === "unary" ? unaryCoercionToFreq : binaryCoercionToFreq);
                var oldFreq = map[coercion] || 0;
                map[coercion] = oldFreq + hashToFrequency[hash];
            }
        });
        printHistogram("Conditionals", conditionalCoercionToFreq);
        printHistogram("Unary", unaryCoercionToFreq);
        printHistogram("Binary", binaryCoercionToFreq);
    }

    function polymorphicCodeLocations(obsAndFreq) {
        console.log("\n====== Are code locations polymorphic? ======\n");
        var hashToObservations = obsAndFreq[0];
        var locationToCoercedTypes = {}; // string --> string --> true
        var locationToUncoercedTypes = {}; // string --> string --> true
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var types = typesOfObservation(obs).toString();
                var coercion = coercionOfObservation(obs);
                var locationToTypes = coercion === "none" ? locationToUncoercedTypes : locationToCoercedTypes;
                var typesAtLocation = locationToTypes[obs.location] || {};
                typesAtLocation[types] = true;
                locationToTypes[obs.location] = typesAtLocation;
            }
        });
        var nbTypesToFreqAllLocations = {};
        var nbTypesToFreqLocationsWithCoercion = {};
        Object.keys(locationToUncoercedTypes).forEach(function(location) {
            var typesAtLocation = locationToUncoercedTypes[location];
            var nbTypes = Object.keys(typesAtLocation).length;
            nbTypesToFreqAllLocations[nbTypes] = 1 + (nbTypesToFreqAllLocations[nbTypes] || 0);
        });
        Object.keys(locationToCoercedTypes).forEach(function(location) {
            var typesAtLocation = locationToCoercedTypes[location];
            var nbTypes = Object.keys(typesAtLocation).length;
            nbTypesToFreqAllLocations[nbTypes] = 1 + (nbTypesToFreqAllLocations[nbTypes] || 0);
            nbTypesToFreqLocationsWithCoercion[nbTypes] = 1 + (nbTypesToFreqLocationsWithCoercion[nbTypes] || 0);
        });
        printHistogram("Frequency of nb of different types per location (all locations)", nbTypesToFreqAllLocations);
        printHistogram("Frequency of nb of different types per location (locations with coercion)", nbTypesToFreqLocationsWithCoercion);
    }

    function equalityOperationsDynamic(obsAndFreq) {
        console.log("\n====== (In)equality operators (dynamic) ======\n");
        var hashToObservations = obsAndFreq[0];
        var hashToFrequency = obsAndFreq[1];
        var triple = {sameTypes:0, differentTypes:0};
        var double = {sameTypes:0, differentTypes:0};
        var tripleToDoubleChangesOutcome = 0;
        var doubleToTripleChangesOutcome = 0;
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var freq = hashToFrequency[hash];
                if (obs.operation === "===" || obs.operation === "!==") {
                    if (obs.leftType === obs.rightType) {
                        triple.sameTypes += freq;
                    } else {
                        triple.differentTypes += freq;
                    }
                    if (obs.resultValue !== obs.alternativeResultValue) {
                        tripleToDoubleChangesOutcome += freq;
                    }
                } else if (obs.operation === "==" || obs.operation === "!=") {
                    if (obs.leftType === obs.rightType) {
                        double.sameTypes += freq;
                    } else {
                        double.differentTypes += freq;
                    }
                    if (obs.resultValue !== obs.alternativeResultValue) {
                        doubleToTripleChangesOutcome += freq;
                    }
                }
            }
        });
        printHistogram("Strict equals", triple);
        console.log("  Non-strict equals changes outcome: " + absAndPerc(tripleToDoubleChangesOutcome, triple.sameTypes + triple.differentTypes) + "\n");
        printHistogram("Non-strict equals", double);
        console.log("  Strict equals changes outcome: " + absAndPerc(doubleToTripleChangesOutcome, double.sameTypes + double.differentTypes) + "\n");
    }

    function equalityOperationsStatic(obsAndFreq) {
        function updateInfos(infos, obs) {
            if (obs.leftType === obs.rightType) {
                infos.sameTypes = true;
            } else {
                infos.differentTypes = true;
            }
            if (obs.resultValue !== obs.alternativeResultValue) {
                infos.changeChangesOutcome = true;
            } else {
                infos.changeMaintainsOutcome = true;
            }
        }

        console.log("\n====== (In)equality operators (static) ======\n");
        var hashToObservations = obsAndFreq[0];
        var locationToInfos = {};  // infos: {operation:string, sameTypes:boolean, differentTypes:boolean, changeChangesOutcome:boolean, changeMaintainsOutcome:boolean}
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var infos = locationToInfos[obs.location] || {operation:obs.operation};
                if (obs.operation === "===" || obs.operation === "!==" || obs.operation === "==" || obs.operation === "!=") {
                    updateInfos(infos, obs);
                }
                locationToInfos[obs.location] = infos;
            }
        });

        var typesForStrict = {alwaysSame:0, alwaysDifferent:0, both:0};
        var changesForStrict = {alwaysChanges:0, neverChanges:0, sometimesChanges:0};
        var typesForNonStrict = {alwaysSame:0, alwaysDifferent:0, both:0};
        var changesForNonStrict = {alwaysChanges:0, neverChanges:0, sometimesChanges:0};

        Object.keys(locationToInfos).forEach(function(location) {
            var infos = locationToInfos[location];
            var isStrict = (infos.operation === "===" || infos.operation === "!==");
            var typesSummary = isStrict ? typesForStrict : typesForNonStrict;
            var changesSummary = isStrict ? changesForStrict : changesForNonStrict;
            if (infos.sameTypes && !infos.differentTypes)
                typesSummary.alwaysSame++;
            else if (!infos.sameTypes && infos.differentTypes)
                typesSummary.alwaysDifferent++;
            else
                typesSummary.both++;
            if (infos.changeChangesOutcome && !infos.changeMaintainsOutcome)
                changesSummary.alwaysChanges++;
            else if (!infos.changeChangesOutcome && infos.changeMaintainsOutcome)
                changesSummary.neverChanges++;
            else
                changesSummary.sometimesChanges++;
        });

        printHistogram("Same types for strict equality operations", typesForStrict);
        printHistogram("Change of outcome when changing strict equality operator to non-strict", changesForStrict);
        printHistogram("Same types for non-strict equality operations", typesForNonStrict);
        printHistogram("Change of outcome when changing non-strict equality operator to strict", changesForNonStrict);
    }

    function printHistogram(caption, histogram) {
        var pairs = [];
        var total = 0;
        for (var type in histogram) {
            var nb = histogram[type];
            pairs.push({type:type, nb:nb});
            total += nb;
        }
        var sortedPairs = pairs.sort(function(a, b) {
            return b.nb - a.nb;
        });
        console.log(caption + ", total: " + total);
        sortedPairs.forEach(function(p) {
            console.log("  " + p.type + " --> " + absAndPerc(p.nb, total));
        });
        console.log();
    }

    function absAndPerc(part, total) {
        return part + " (" + Math.round((part / total) * 10000) / 100 + "%)";
    }


    var bmGroupDirs = process.argv.slice(2); // directories that contain benchmark directories (e.g., "sunspider" contains "3d-cube" etc.)
    var bmDirs = [];
    bmGroupDirs.forEach(function(bmGroupDir) {
        fs.readdirSync(bmGroupDir).forEach(function(bmName) {
            bmDirs.push(bmGroupDir + "/" + bmName);
        });
    });
    var obsAndFreq = mergeObs(bmDirs);
    typesAndOperators(obsAndFreq);
    prevalenceOfCoercions(obsAndFreq);
    polymorphicCodeLocations(obsAndFreq);
    equalityOperationsDynamic(obsAndFreq);
    equalityOperationsStatic(obsAndFreq);

})();
