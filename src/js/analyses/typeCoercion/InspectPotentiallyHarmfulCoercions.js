// Author: Michael Pradel

(function() {

    var observationParser = require('./ObservationParser.js');
    var util = require("./CommonUtil.js");
    var m = require('./Mappers.js');
    var f = require('./Filters.js');

    var bmGroupDirs = [
        "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/websites_subset"
    ];

    function getHarmfulObservations() {
        var onlineAnalysisResults = observationParser.parseDirs(bmGroupDirs);
        var allObservations = onlineAnalysisResults.observations;
        return allObservations.filter(f.obs.isHarmful);
    }

    function getSourceMaps(bm) {
        // TODO
    }

    // random sampling of code locations (indep. of dyn. frequency)
    function sample(observations, sampleSize) {
        var locToObservations = {};
        for (var i = 0; i < observations.length; i++) {
            var obs = observations[i];
            var obsForLoc = locToObservations[obs.location] || [];
            obsForLoc.push(obs);
            locToObservations[obs.location] = obsForLoc;
        }
        var locsToInspect = util.randomSample(Object.keys(locToObservations), sampleSize);
        var resultLocToObservations = {};
        for (i = 0; i < locsToInspect.length; i++) {
            var loc = locsToInspect[i];
            resultLocToObservations[loc] = locToObservations[loc];
        }
        return resultLocToObservations;
    }

    function print(locToObservations) {
        console.log(JSON.stringify(locToObservations, null, 2));
    }

    var observations = getHarmfulObservations();

    print(sample(observations, 30));


})();