// Author: Michael Pradel

(function() {

    var fs = require('fs');
    var util = require("./CommonUtil.js");
    var offlineObservations = require('./OfflineObservations.js');

    function AnalysisResults(observations, bmToMaxCallID, benchmarks, benchmarkGroups) {
        this.observations = observations;
        this.bmToMaxCallID = bmToMaxCallID;
        this.benchmarks = benchmarks;
        this.benchmarkGroups = benchmarkGroups;
    }

    AnalysisResults.prototype = {
        resolveBenchmark:function(nb) {
            if (nb < 0 || nb > this.benchmarks.length) throw new Error("Unexpected benchmark nb: " + nb);
            return this.benchmarks[nb];
        },
        resolveBenchmarkGroup:function(nb) {
            if (nb < 0 || nb > this.benchmarkGroups.length) throw new Error("Unexpected benchmark group nb: " + nb);
            return this.benchmarkGroups[nb];
        }
    };

    function mergeObs(bmDirs) {
        var bmToMaxCallID = {};
        var benchmarks = [];
        var benchmarkGroups = [];
        var allObs = [];
        for (var i = 0; i < bmDirs.length; i++) {
            var bmDir = bmDirs[i];
            console.log("Reading directory " + bmDir);
            var allHashToObs = {};
            var analysisResultsRaw = fs.readFileSync(bmDir + "/analysisResults.json");
            var analysisResults = JSON.parse(analysisResultsRaw);
            var bmName = bmDir.split("/")[bmDir.split("/").length - 1];
            var bm = getOrCreateIndex(benchmarks, bmName);
            var bmGroupName = bmDir.split("/")[bmDir.split("/").length - 2];
            var bmGroup = getOrCreateIndex(benchmarkGroups, bmGroupName);
            if (analysisResults.length !== 1) throw "Unexpected number of analysis results: " + analysisResults.length;
            bmToMaxCallID[bm] = analysisResults[0].value.maxCallID;
            analysisResults.forEach(function(analysisResult) {
                var hashToObs = analysisResult.value.hashToObservations;
                var hashToFreq = analysisResult.value.hashToFrequency;
                var hashToCallIDs = analysisResult.value.hashToCallIDs;
                console.log("  Found analysis result with " + Object.keys(hashToObs).length + " hashes");
                Object.keys(hashToObs).forEach(function(hash) {
                    var obs = hashToObs[hash];
                    delete obs.isStrict;  // save memory
                    delete obs.hash;      // save memory
                    obs.benchmark = bm;
                    obs.benchmarkGroup = bmGroup;
                    obs.callIDs = hashToCallIDs[hash];
                    if (util.HOP(allHashToObs, hash)) {
                        // have already seen this observation: add frequency to total dynamic frequency
                        obs.frequency += hashToFreq[hash];
                    } else {
                        allHashToObs[hash] = obs;
                        obs.frequency = hashToFreq[hash];
                    }
                });
            });
            var hashes = Object.keys(allHashToObs);
            for (var j = 0; j < hashes.length; j++) {
                var obs = allHashToObs[hashes[j]];
                var offlineObs = offlineObservations.toOfflineObservation(obs);
                allObs.push(offlineObs);
            }

            console.log("Reading directory " + bmDir + " ... done (total observations now: " + allObs.length + ")");
        }

        console.log("Creating list of observations ... done");
        return new AnalysisResults(allObs, bmToMaxCallID, benchmarks, benchmarkGroups);
    }

    function getOrCreateIndex(array, elem) {
        var i = array.indexOf(elem);
        if (i !== -1) return i;
        array.push(elem);
        return array.length - 1;
    }

    function parseDirs(bmGroupDirs) {
        var bmDirs = [];
        for (var i = 0; i < bmGroupDirs.length; i++) {
            var bmGroupDir = bmGroupDirs[i];
            fs.readdirSync(bmGroupDir.toString()).forEach(function(bmName) {
                bmDirs.push(bmGroupDir + "/" + bmName);
            });
        }
        console.log("Parsing directories ... done: "+bmDirs.length);
        return mergeObs(bmDirs);
    }

    exports.parseDirs = parseDirs;

})();