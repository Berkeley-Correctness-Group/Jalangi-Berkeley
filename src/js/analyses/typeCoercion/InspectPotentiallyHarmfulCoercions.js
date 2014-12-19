// Author: Michael Pradel

(function() {

    var observationParser = require('./ObservationParser.js');
    var util = require("./CommonUtil.js");
    var offlineCommon = require('../OfflineAnalysesCommon.js');
    var m = require('./Mappers.js');
    var f = require('./Filters.js');

    var baseDir = "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/";

    var bmGroupDirs = [
        baseDir + "websites",
        baseDir + "octane",
        baseDir + "sunspider"
    ];

    function location(analysisResults, obs) {
        var bm = analysisResults.benchmarks[obs.benchmark];
        var bmGroup = analysisResults.benchmarkGroups[obs.benchmarkGroup];
        var sourceMapDir = baseDir + bmGroup + "/" + bm + "/sourcemaps/";
        var iids = offlineCommon.loadIIDs(sourceMapDir);
        return iids[obs.iid];
    }

    // random sampling of code locations (indep. of dyn. frequency)
    function sample(observations, sampleSize) {
        var locToObservations = {};
        for (var i = 0; i < observations.length; i++) {
            var obs = observations[i];
            var loc = obs.benchmark + "@@@" + obs.iid;
            var obsForLoc = locToObservations[loc] || [];
            obsForLoc.push(obs);
            locToObservations[loc] = obsForLoc;
        }
        var locsToInspect = util.randomSample(Object.keys(locToObservations), sampleSize);
        var resultLocToObservations = {};
        for (i = 0; i < locsToInspect.length; i++) {
            var loc = locsToInspect[i];
            resultLocToObservations[loc] = locToObservations[loc];
        }
        return resultLocToObservations;
    }

    function print(analysisResults, locToObservations) {
        var detailedLocToObservations = {};
        Object.keys(locToObservations).forEach(function(loc) {
            var obs = locToObservations[loc][0];
            var instrumentFFTmpPath = location(analysisResults, obs)[0];
            var fileName = instrumentFFTmpPath.split("instrumentFF_tmp/")[1];
            var permanentLocation = baseDir + analysisResults.benchmarkGroups[obs.benchmarkGroup] + "/" + analysisResults.benchmarks[obs.benchmark] + "/src/" + fileName;
            detailedLocToObservations[permanentLocation] = locToObservations[loc];
        });

        console.log(JSON.stringify(detailedLocToObservations, null, 2));
    }

    var analysisResults = observationParser.parseDirs(bmGroupDirs);
    var allObservations = analysisResults.observations;
    var harmfulObservations = allObservations.filter(f.obs.isHarmful);

    print(analysisResults, sample(harmfulObservations, 30));


})();