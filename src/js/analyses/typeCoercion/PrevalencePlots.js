// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var bmGroups = require('./BenchmarkGroups.js');
    var plots = require('./Plots.js');

    function byType(observations) {
        ["static", "dynamic"].forEach(function(mode) {
            var obsStrAndFreqs = observations.map(m.obs.toAbstractStringAndFreq).filter(f.strAndFreq.notNone);
            if (mode === "static") {
                obsStrAndFreqs.forEach(function(strAndFreq) {
                    strAndFreq.freq = 1;
                })
            }
            var histo = plots.strAndFreqsToHistogram(obsStrAndFreqs);
            plots.plotHistogram(histo, mode + "_prevalence", "Percentage", {wide:true});
        });
    }

    function byBenchmarkGroup(allObservations) {
        var bmGroup2Bm2Observations = bmGroups.groupObservations(allObservations);
        ["static", "dynamic"].forEach(function(mode) {
            var bmGroup2Percentages = {};
            for (var bmGroup in bmGroup2Bm2Observations) {
                var bm2Observations = bmGroup2Bm2Observations[bmGroup];
                var percentages = bmGroup2Percentages[bmGroup] || [];
                for (var bm in bm2Observations) {
                    var observations = bm2Observations[bm];
                    var strAndFreqs = observations.map(m.obs.toStringAndFreq);
                    if (mode === "static") {
                        strAndFreqs.forEach(function(strAndFreq) {
                            strAndFreq.freq = 1;
                        })
                    }
                        var totalFreq = strAndFreqs.reduce(r.obsAndFreq.addFreq, 0);
                        var coercionsFreq = strAndFreqs.filter(f.strAndFreq.notNone).reduce(r.obsAndFreq.addFreq, 0);
                        percentages.push(coercionsFreq / totalFreq);
                }
                bmGroup2Percentages[bmGroup] = percentages;
            }
            plots.plotBoxAndWhisker(bmGroup2Percentages, "prevalence_by_benchmark_group_"+mode, "Coercions among all operations (%)");
        });
    }

    exports.byType = byType;
    exports.byBenchmarkGroup = byBenchmarkGroup;

})();