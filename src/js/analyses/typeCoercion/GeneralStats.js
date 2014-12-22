// Author: Michael Pradel

(function() {

    var macros = require('./Macros.js');
    var util = require("./CommonUtil.js");

    function observationStats(analysisResults) {
        var bmToNbObs = {};
        var bmGroupToNbObs = {};
        var totalObs = 0;
        var locsWithObs = {};
        for (var i = 0; i < analysisResults.observations.length; i++) {
            var obs = analysisResults.observations[i];
            bmToNbObs[obs.benchmark] = (bmToNbObs[obs.benchmark] || 0) + obs.frequency;
            bmGroupToNbObs[obs.benchmarkGroup] = (bmGroupToNbObs[obs.benchmarkGroup] || 0) + obs.frequency;
            totalObs += obs.frequency;
            locsWithObs[obs.benchmark+"@@@"+obs.iid] = true;
        }
        var totalLocsWithObs = Object.keys(locsWithObs).length;

        macros.writeMacro("totalObservations", util.numberWithCommas(totalObs));
        macros.writeMacro("totalLocationsWithObservations", util.numberWithCommas(totalLocsWithObs));
        macros.writeMacro("totalPrograms", Object.keys(bmToNbObs).length);
    }

    exports.observationStats = observationStats;

})();