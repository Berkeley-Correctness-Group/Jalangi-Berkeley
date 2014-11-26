// Author: Michael Pradel

(function() {

    var fs = require('fs');
    var util = require("./CommonUtil.js");
    var offlineCommon = require('../OfflineAnalysesCommon.js');

    function mergeObs(bmDirs) {
        var allHashToObs = {};
        bmDirs.forEach(function(bmDir) {
            var analysisResultsRaw = fs.readFileSync(bmDir + "/analysisResults.json");
            var analysisResults = JSON.parse(analysisResultsRaw);
            var iids = offlineCommon.loadIIDs(bmDir + "/sourcemaps/");
            var bm = bmDir.split("/")[bmDir.split("/").length - 1];
            var bmGroup = bmDir.split("/")[bmDir.split("/").length - 2];
            analysisResults.forEach(function(analysisResult) {
                var hashToObs = analysisResult.value.hashToObservations;
                var hashToFreq = analysisResult.value.hashToFrequency;
                Object.keys(hashToObs).forEach(function(hash) {
                    var obs = hashToObs[hash];
                    obs.location = obs.operation + " at " + iids[obs.iid] + "(" + obs.iid + ") of " + bm;  // unique identifier of source code location
                    obs.benchmark = bm;
                    obs.benchmarkGroup = bmGroup;
                    if (util.HOP(allHashToObs, hash)) {
                        // have already seen this observation: add frequency to total dynamic frequency
                        obs.frequency += hashToFreq[hash];
                    } else {
                        allHashToObs[hash] = obs;
                        obs.frequency = hashToFreq[hash];
                    }
                });
            });
        });
        var allObs = [];
        Object.keys(allHashToObs).forEach(function(hash) {
            allObs.push(allHashToObs[hash]);
        });
        return allObs;
    }


    function parseDirs(bmGroupDirs) {
        var bmDirs = [];
        for (var i = 0; i < bmGroupDirs.length; i++) {
            var bmGroupDir = bmGroupDirs[i];
            fs.readdirSync(bmGroupDir.toString()).forEach(function(bmName) {
                bmDirs.push(bmGroupDir + "/" + bmName);
            });
        }
        return mergeObs(bmDirs);
    }

    exports.parseDirs = parseDirs;

})();