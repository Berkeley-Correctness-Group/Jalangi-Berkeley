// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var bmGroups = require('./BenchmarkGroups.js');
    var plots = require('./Plots.js');

    /**
     * Histogram of percentages of different kinds of type coercions (e.g., 5% number in conditional).
     * @param observations
     */
    function byType(observations) {
        ["static", "dynamic"].forEach(function(mode) {
            var obsStrAndFreqs = observations.map(m.obs.toAbstractStringAndFreq).filter(f.strAndFreq.notNone);
            obsStrAndFreqs = mode === "static" ? obsStrAndFreqs.map(m.strAndFreq.toStatic) : obsStrAndFreqs;
            var histo = plots.strAndFreqsToHistogram(obsStrAndFreqs);
            plots.plotHistogram(histo, "prevalence_by_type_" + mode, "Percentage", {
                toPercentages:true,
                wide:true,
                maxValues:20
            });
        });
    }


    /**
     * Box and whisker plot of coercions over all operations in
     * different benchmark groups (e.g., 5%-25% in websites).
     * @param allRawObservations
     */
    function byBenchmarkGroup(allRawObservations) {
        var bmGroup2Bm2Observations = bmGroups.groupByGroupAndBenchmark(allRawObservations);
        ["static", "dynamic"].forEach(function(mode) {
            var bmGroup2Percentages = bmGroups.computeByBenchmarkGroup(bmGroup2Bm2Observations, observationsToCoercionPercentage, mode);
            plots.plotBoxAndWhisker(bmGroup2Percentages, "prevalence_by_benchmark_group_" + mode, "Coercions among all operations (%)");
        });
    }

    function observationsToCoercionPercentage(observations) {
        var classificationAndFreq = observations.map(m.obs.toClassificationAndFreq);
        var totalFreq = classificationAndFreq.reduce(r.obsAndFreq.addFreq, 0);
        var coercionFreq = classificationAndFreq.filter(f.strAndFreq.notNone).reduce(r.obsAndFreq.addFreq, 0);
        return totalFreq !== 0 ? (coercionFreq / totalFreq) * 100 : undefined;
    }

    function observationsToHarmfulPercentage(observations) {
        var classificationAndFreq = observations.map(m.obs.toClassificationAndFreq);
        var totalFreq = classificationAndFreq.filter(f.strAndFreq.notNone).reduce(r.obsAndFreq.addFreq, 0);
        var harmfulFreq = classificationAndFreq.filter(f.strAndFreq.isHarmful).reduce(r.obsAndFreq.addFreq, 0);
        return totalFreq !== 0 ? (harmfulFreq / totalFreq) * 100 : undefined;
    }

    /**
     * Histogram of percentage of coercions
     * in different benchmarks (for top N benchmarks).
     * @param allObservations
     */
    function byBenchmark(allObservations) {
        var bm2Observations = bmGroups.groupByBenchmark(allObservations);
        ["static", "dynamic"].forEach(function(mode) {
            var bm2PercentageOfCoercions = bmGroups.computeByBenchmark(bm2Observations, observationsToCoercionPercentage, 20, mode);
            plots.plotHistogram(bm2PercentageOfCoercions, "prevalence_by_benchmark_" + mode,
                  "Coercions among all operations (%)", {wide:true});
        });
    }

    /**
     * Box and whisker plot of percentage of potentially harmful coercions in
     * different benchmark groups (e.g., 2%-12% in websites).
     * @param observations
     */
    function harmfulByBenchmarkGroup(observations) {
        var bmGroup2Bm2Observations = bmGroups.groupByGroupAndBenchmark(observations);
        ["static", "dynamic"].forEach(function(mode) {
            var bmGroup2Percentages = bmGroups.computeByBenchmarkGroup(bmGroup2Bm2Observations, observationsToHarmfulPercentage, mode);
            plots.plotBoxAndWhisker(bmGroup2Percentages, "harmfulness_by_benchmark_group_" + mode, "Potentially harmful coercions (%)");
        });
    }

    /**
     * Histogram of percentage of potentially harmful coercions
     * in different benchmarks (for top N benchmarks).
     * @param allObservations
     */
    function harmfulByBenchmark(allObservations) {
        var bm2Observations = bmGroups.groupByBenchmark(allObservations);
        ["static", "dynamic"].forEach(function(mode) {
            var bm2Percentage = bmGroups.computeByBenchmark(bm2Observations, observationsToHarmfulPercentage, 20, mode);
            plots.plotHistogram(bm2Percentage, "harmfulness_by_benchmark_" + mode, "Potentially harmful coercions (%)",
                  {
                      wide:true,
                      maxValues:20
                  });
        });
    }

    /**
     * Histogram of percentages of potentially harmful coercions.
     * @param observations
     */
    function harmfulByType(observations) {
        ["static", "dynamic"].forEach(function(mode) {
            var strAndFreqs = observations.map(m.obs.toAbstractStringAndClassificationAndFreq)
                  .filter(f.strAndClassAndFreq.isHarmful)
                  .map(m.strAndClassAndFreq.toStrAndFreq);
            strAndFreqs = mode === "static" ? strAndFreqs.map(m.strAndFreq.toStatic) : strAndFreqs;
            var histo = plots.strAndFreqsToHistogram(strAndFreqs);
            plots.plotHistogram(histo, "harmful_by_type_" + mode, "Percentage", {
                toPercentages:true,
                wide:true,
                maxValues:20
            });
        });
    }

    function callsWithCoercionPercentage(allObservations, bmToMaxCallID) {
        var totalCalls = 0;
        var callsWithCoercion = 0;
        var bm2Observations = bmGroups.groupByBenchmark(allObservations);
        var bms = Object.keys(bm2Observations);
        var bmToPercentage = {};
        for (var i = 0; i < bms.length; i++) {
            var bm = bms[i];
            var observations = bm2Observations[bm];
            var callIDsWithCoercion = {};
            for (var j = 0; j < observations.length; j++) {
                var obs = observations[j];
                var callIDsOfObs = Object.keys(obs.callIDs);
                for (var k = 0; k < callIDsOfObs.length; k++) {
                    callIDsWithCoercion[callIDsOfObs[k]] = true;
                }
            }
            var bmTotal = bmToMaxCallID[bm];
            var bmWith = Object.keys(callIDsWithCoercion).length;
            var percentage = bmWith * 100 / bmTotal;
            bmToPercentage[bm] = percentage;
            totalCalls += bmTotal;
            callsWithCoercion += bmWith;
        }
        plots.plotHistogram(bmToPercentage, "percentage_calls_with_coercion", "Percentage of calls", {
            maxValues:20,
            wide:true
        });

        console.log("Calls with coercion: " + (callsWithCoercion * 100 / totalCalls) + "%  (" + callsWithCoercion + "/" + totalCalls + ")");
    }

    exports.byType = byType;
    exports.byBenchmarkGroup = byBenchmarkGroup;
    exports.byBenchmark = byBenchmark;
    exports.harmfulByBenchmarkGroup = harmfulByBenchmarkGroup;
    exports.harmfulByBenchmark = harmfulByBenchmark;
    exports.harmfulByType = harmfulByType;
    exports.callsWithCoercioRatio = callsWithCoercionPercentage;

})();