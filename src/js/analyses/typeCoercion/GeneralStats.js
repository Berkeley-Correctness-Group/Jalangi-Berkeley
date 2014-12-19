// Author: Michael Pradel

(function() {

    var macros = require('./Macros.js');
    var util = require("./CommonUtil.js");

    function observationStats(analysisResults) {
        var bmToNbObs = {};
        var bmGroupToNbObs = {};
        var totalObs = 0;
        for (var i = 0; i < analysisResults.observations.length; i++) {
            var obs = analysisResults.observations[i];
            bmToNbObs[obs.benchmark] = (bmToNbObs[obs.benchmark] || 0) + obs.frequency;
            bmGroupToNbObs[obs.benchmarkGroup] = (bmGroupToNbObs[obs.benchmarkGroup] || 0) + obs.frequency;
            totalObs += obs.frequency;
        }

        macros.writeMacro("totalObservations", totalObs + "\\%");
        
    }

    exports.observationStats = observationStats;

})();