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
            var iids = offlineCommon.loadIIDs(bmDir+"/sourcemaps/");
            analysisResults.forEach(function(analysisResult) {
                var hashToObs = analysisResult.value.hashToObservations;
                var hashToFreq = analysisResult.value.hashToFrequency;
                Object.keys(hashToObs).forEach(function(hash) {
                    if (util.HOP(allHashToObs, hash)) {
                        console.log("Hash collision! Ignoring observation with hash " + hash + " from " + bmDir);
                    } else {
                        var obs = hashToObs[hash];
                        obs.iid = iids[obs.iid];
                        allHashToObs[hash] = hashToObs[hash];
                        allHashToFreq[hash] = hashToFreq[hash];
                    }
                });
            });
        });
        return [allHashToObs, allHashToFreq];
    }

    function kindOfObservation(obs) {
        if (obs.operation === "conditional")
            return "conditional";
        if (util.HOP(obs, "rightType"))
            return "binary";
        return "unary";
    }

    /*
     * String description of the coercion (or "none").
     */
    function coercionOfObservation(obs) {
        var kind = kindOfObservation(obs);
        var op = obs.operation;
        if (kind === "conditional") {
            if (obs.type === "boolean") {
                return "none";
            } else {
                return obs.type + " in conditional";
            }
        } else if (kind === "unary") {
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
        } else if (kind === "binary") {
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

    function typesAndOperators(obsAndFreq) {
        var hashToObservations = obsAndFreq[0];
        var typesAndOps = {}; // string --> true
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            var kind = kindOfObservation(obs);
            var s;
            if (kind === "binary") {
                s = obs.leftType + " " + obs.operation + " " + obs.leftType;
            } else { // conditional or unary
                s = obs.operation + " " + obs.type;
            }
            typesAndOps[s] = true;
        });
        Object.keys(typesAndOps).forEach(function(s) {
            console.log(s);
        });
    }

    function dynamicPrevalenceOfCoercions(obsAndFreq) {
        console.log("\n====== Dynamic prevalence of type coercions ======\n");
        var hashToObservations = obsAndFreq[0];
        var hashToFrequency = obsAndFreq[1];
        var conditionalCoercionToFreq = {};
        var unaryCoercionToFreq = {};
        var binaryCoercionToFreq = {};
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            var kind = kindOfObservation(obs);
            var coercion = coercionOfObservation(obs);
            var map = kind === "conditional" ? conditionalCoercionToFreq : (kind === "unary" ? unaryCoercionToFreq : binaryCoercionToFreq);
            var oldFreq = map[coercion] || 0;
            map[coercion] = oldFreq + hashToFrequency[hash];
        });
        console.log("Conditionals:\n" + sortedHistogram(conditionalCoercionToFreq));
        console.log("Unary:\n" + sortedHistogram(unaryCoercionToFreq));
        console.log("Binary:\n" + sortedHistogram(binaryCoercionToFreq));
    }
    
    function staticPrevalenceOfCoercions(obsAndFreq) {
        console.log("\n====== Static prevalence of type coercions ======\n");
        var hashToObservations = obsAndFreq[0];
        var conditionalCoercionToFreq = {};
        var unaryCoercionToFreq = {};
        var binaryCoercionToFreq = {};
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            var kind = kindOfObservation(obs);
            var coercion = coercionOfObservation(obs);
            var map = kind === "conditional" ? conditionalCoercionToFreq : (kind === "unary" ? unaryCoercionToFreq : binaryCoercionToFreq);
            var oldFreq = map[coercion] || 0;
            map[coercion] = oldFreq + 1;
        });
        console.log("Conditionals:\n" + sortedHistogram(conditionalCoercionToFreq));
        console.log("Unary:\n" + sortedHistogram(unaryCoercionToFreq));
        console.log("Binary:\n" + sortedHistogram(binaryCoercionToFreq));
    }
    
    
    function sortedHistogram(histogram) {
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
    

    var bmGroupDirs = process.argv.slice(2); // directories that contain benchmark directories (e.g., "sunspider" contains "3d-cube" etc.)
    var bmDirs = [];
    bmGroupDirs.forEach(function(bmGroupDir) {
        fs.readdirSync(bmGroupDir).forEach(function(bmName) {
            bmDirs.push(bmGroupDir + "/" + bmName);
        });
    });
    var obsAndFreq = mergeObs(bmDirs);
    typesAndOperators(obsAndFreq);
    dynamicPrevalenceOfCoercions(obsAndFreq);
    staticPrevalenceOfCoercions(obsAndFreq);
    
})();
