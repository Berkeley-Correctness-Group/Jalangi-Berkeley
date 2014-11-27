// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');

    function groupByGroupAndBenchmark(allObservations) {
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

    function groupByBenchmark(allObservations) {
        var bm2Observations = {};
        for (var i = 0; i < allObservations.length; i++) {
            var obs = allObservations[i];
            var observations = bm2Observations[obs.benchmark] || [];
            observations.push(obs);
            bm2Observations[obs.benchmark] = observations;
        }
        return bm2Observations;
    }

    /**
     * For each benchmark, applies some function on all observations of the benchmark
     * and summarizes the resulting benchmark-value pairs.
     * @param bm2Observations
     * @param observationsToValueFun
     * @param maxNbValues
     * @mode "static" or "dynamic"
     * @returns map from at most maxNbValues benchmarks to the computed value
     */
    function computeByBenchmark(bm2Observations, observationsToValueFun, maxNbValues, mode) {
        var bmAndValue = [];
        for (var bm in bm2Observations) {
            var observations = bm2Observations[bm];
            observations = mode === "static" ? observations.map(m.obs.toStatic) : observations;
            var value = observationsToValueFun(observations);
            if (typeof value !== "undefined") {
                bmAndValue.push({bm:bm, value:value});
            }
        }
        bmAndValue.sort(function(a, b) {
            return b.value - a.value;
        });
        bmAndValue = bmAndValue.slice(0, Math.min(maxNbValues, bmAndValue.length));
        var bm2Values = {};
        for (var i = 0; i < bmAndValue.length; i++) {
            bm2Values[bmAndValue[i].bm] = bmAndValue[i].value;
        }
        return bm2Values;
    }

    /**
     * For each benchmark group, applies some function to each benchmark and
     * summarizes the resulting values.
     * @param bmGroup2Bm2Observations
     * @param observationsToValueFun
     * @param mode
     * @return map from benchmark group to array of values (one value per benchmark in the group)
     */
    function computeByBenchmarkGroup(bmGroup2Bm2Observations, observationsToValueFun, mode) {
        var bmGroup2Values = {};
        for (var bmGroup in bmGroup2Bm2Observations) {
            var bm2Observations = bmGroup2Bm2Observations[bmGroup];
            var values = bmGroup2Values[bmGroup] || [];
            for (var bm in bm2Observations) {
                var observations = bm2Observations[bm];
                observations = mode === "static" ? observations.map(m.obs.toStatic) : observations;
                var value = observationsToValueFun(observations);
                if (typeof value !== "undefined") {
                    values.push(value);
                }
            }
            bmGroup2Values[bmGroup] = values;
        }
        return bmGroup2Values;
    }

    exports.groupByGroupAndBenchmark = groupByGroupAndBenchmark;
    exports.groupByBenchmark = groupByBenchmark;
    exports.computeByBenchmark = computeByBenchmark;
    exports.computeByBenchmarkGroup = computeByBenchmarkGroup;

})();