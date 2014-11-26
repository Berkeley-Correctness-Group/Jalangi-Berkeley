// Author: Michael Pradel

(function() {

    function groupObservations(allObservations) {
        var bmGroup2Bm2Observations = {};
        for (var i = 0; i < allObservations.length; i++) {
            var obs = allObservations[i];
            var bm = obs.benchmark;
            var group = obs.benchmarkGroup;
            var bm2Observations = bmGroup2Bm2Observations[group] || {};
            var observations = bm2Observations[bm] || [];
            observations.push(obs);
            bm2Observations[bm] = observations;
            bmGroup2Bm2Observations[group] = bm2Observations;
        }
        return bmGroup2Bm2Observations;
    }

    exports.groupObservations = groupObservations;

})();