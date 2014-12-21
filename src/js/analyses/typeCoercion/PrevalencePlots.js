// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var bmGroups = require('./BenchmarkGroups.js');
    var plots = require('./Plots.js');
    var macros = require('./Macros.js');
    var util = require("./CommonUtil.js");

    /**
     * Histogram of percentages of different kinds of type coercions (e.g., 5% number in conditional).
     * @param observations
     */
    function byType(analysisResults) {
        ["static", "dynamic"].forEach(function(mode) {
            var obsStrAndFreqs = analysisResults.observations.map(m.obs.toAbstractStringAndFreq).filter(f.strAndFreq.notNone);
            obsStrAndFreqs = mode === "static" ? obsStrAndFreqs.map(m.strAndFreq.toStatic) : obsStrAndFreqs;
            var strToFreq = plots.strAndFreqsToHistogram(obsStrAndFreqs);
            plots.plotHistogram(strToFreq, "prevalence_by_type_" + mode, "Percentage", {
                toPercentages:true,
                wide:true,
                maxValues:20
            });

            if (mode === "dynamic") {
                var total = util.mapToValues(strToFreq).reduce(r.number.add, 0);
                var condRel = 0;
                Object.keys(strToFreq).filter(f.str.isConditionalRelated).forEach(function(str) {
                    condRel += strToFreq[str];
                });
                macros.writeMacro("percentageConditionalRelatedDynamic", util.roundPerc(condRel * 100 / total) + "\\%");
            }
        });
    }

    /**
     * Box and whisker plot of coercions over all operations in
     * different benchmark groups (e.g., 5%-25% in websites).
     * @param allRawObservations
     */
    function byBenchmarkGroup(analysisResults) {
        var bmGroup2Bm2Observations = bmGroups.groupByGroupAndBenchmark(analysisResults);
        ["static", "dynamic"].forEach(function(mode) {
            var bmGroup2Percentages = bmGroups.computeByBenchmarkGroup(bmGroup2Bm2Observations, observationsToCoercionPercentage, mode, analysisResults);
            if (mode === "static" && bmGroup2Percentages["websites"]) {
                var avgWebsitesStatic = util.avgOfArray(bmGroup2Percentages["websites"]);
                macros.writeMacro("percentageCoercionsAmongOperationsWebsites", util.roundPerc(avgWebsitesStatic) + "\\%");
            }
            plots.plotBoxAndWhisker(bmGroup2Percentages, "prevalence_by_benchmark_group_" + mode, "Coercions among operations (%)");
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
    function byBenchmark(analysisResults) {
        var bm2Observations = bmGroups.groupByBenchmark(analysisResults);
        ["static", "dynamic"].forEach(function(mode) {
            var bm2PercentageOfCoercions = bmGroups.computeByBenchmark(bm2Observations, observationsToCoercionPercentage, mode, analysisResults);

            if (mode === "dynamic") { // compute average percentage of (dynamic) coercions
                var sumOfPercentages = util.mapToValues(bm2PercentageOfCoercions).reduce(r.number.add, 0);
                var avgPercentage = sumOfPercentages / Object.keys(bm2PercentageOfCoercions).length;
                macros.writeMacro("avgPercentageCoercions", util.roundPerc(avgPercentage));
            }

            Object.keys(bm2PercentageOfCoercions).forEach(function(bmName) {
                var bmNb = analysisResults.benchmarks.indexOf(bmName);
                if (bm2Observations[bmNb].length < 100) {
                    delete bm2PercentageOfCoercions[bmName]; // ignore benchmarks with few observations
                }
            });
            plots.plotHistogram(bm2PercentageOfCoercions, "prevalence_by_benchmark_" + mode,
                  "Coercions among operations (%)", {wide:true, maxValues:20});
        });
    }

    /**
     * Box and whisker plot of percentage of potentially harmful coercions in
     * different benchmark groups (e.g., 2%-12% in websites).
     * @param observations
     */
    function harmfulByBenchmarkGroup(analysisResults) {
        var bmGroup2Bm2Observations = bmGroups.groupByGroupAndBenchmark(analysisResults);
        ["static", "dynamic"].forEach(function(mode) {
            var bmGroup2Percentages = bmGroups.computeByBenchmarkGroup(bmGroup2Bm2Observations, observationsToHarmfulPercentage, mode, analysisResults);
            plots.plotBoxAndWhisker(bmGroup2Percentages, "harmfulness_by_benchmark_group_" + mode, "Potentially harmful coerc. (%)");

            var percentageHarmfulOnWebsitesDynamic;
            if (mode === "dynamic" && bmGroup2Percentages["websites"]) {
                percentageHarmfulOnWebsitesDynamic = util.roundPerc(bmGroup2Percentages["websites"][1]);
            } else percentageHarmfulOnWebsitesDynamic = "???"
            macros.writeMacro("percentageHarmfulOnWebsitesDynamic", percentageHarmfulOnWebsitesDynamic + "\\%");


        });
    }

    /**
     * Histogram of percentage of potentially harmful coercions
     * in different benchmarks (for top N benchmarks).
     * @param allObservations
     */
    function harmfulByBenchmark(analysisResults) {
        var bm2Observations = bmGroups.groupByBenchmark(analysisResults);
        Object.keys(bm2Observations).forEach(function(bm) {
            if (bm2Observations[bm].length < 100) {
                delete bm2Observations[bm]; // ignore benchmarks with few observations
            }
        });
        ["static", "dynamic"].forEach(function(mode) {
            var bm2Percentage = bmGroups.computeByBenchmark(bm2Observations, observationsToHarmfulPercentage, mode, analysisResults);
            plots.plotHistogram(bm2Percentage, "harmfulness_by_benchmark_" + mode, "Potentially harmful coerc. (%)",
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
    function harmfulByType(analysisResults) {
        ["static", "dynamic"].forEach(function(mode) {
            var strAndFreqs = analysisResults.observations.map(m.obs.toAbstractStringAndClassificationAndFreq)
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

    function overallPercentageHarmful(analysisResults) {
        var percentage = observationsToHarmfulPercentage(analysisResults.observations);
        macros.writeMacro("percentageHarmfulCoercions", util.roundPerc(percentage) + "\\%");
        macros.writeMacro("percentageHarmlessCoercions", util.roundPerc(100 - percentage) + "\\%");
    }

    function callsWithCoercionPercentage(analysisResults) {
        var totalCalls = 0;
        var callsWithCoercion = 0;
        var bm2Observations = bmGroups.groupByBenchmark(analysisResults);
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
            var bmTotal = analysisResults.bmToMaxCallID[bm] + 1;
            var bmWith = Object.keys(callIDsWithCoercion).length;
            var percentage = bmWith > 0 && bmTotal > 0 ? bmWith * 100 / bmTotal : 0;
            if (bmTotal >= 100) {  // exclude benchmarks with very few calls (some have only one!) from histogram
                bmToPercentage[analysisResults.resolveBenchmark(bm)] = percentage;
            }
            totalCalls += bmTotal;
            callsWithCoercion += bmWith;

            console.log(analysisResults.resolveBenchmark(bm) + " has " + bmTotal + " calls");
        }
        plots.plotHistogram(bmToPercentage, "percentage_calls_with_coercion", "Percentage of calls", {
            maxValues:20,
            wide:true
        });

        var overallPercentage = callsWithCoercion * 100 / totalCalls;
        macros.writeMacro("percentageCallsWithCoercion", util.roundPerc(overallPercentage) + "\\%");

        console.log("Calls with coercion: " + overallPercentage + "%  (" + callsWithCoercion + "/" + totalCalls + ")");
    }

    function libsVsOthers(allObservations) {
        ["static", "dynamic"].forEach(function(mode) {
            var componentToObservations = {};
            for (var i = 0; i < allObservations.length; i++) {
                var obs = allObservations[i];
                var comp;
                if (obs.location.indexOf("jquery") !== -1) { // TODO resolve iid on demand (location doesn't exist anymore)
                    comp = "jquery";
                }
                if (comp) {
                    var compObs = componentToObservations[comp] || [];
                    compObs.push(obs);
                    componentToObservations[comp] = compObs;
                }
            }
            componentToObservations["all"] = allObservations;

            var compToPercentage = {};
            var comps = Object.keys(componentToObservations);
            for (i = 0; i < comps.length; i++) {
                var obsForComp = componentToObservations[comps[i]];
                obsForComp = mode === "static" ? obsForComp.map(m.obs.toStatic) : obsForComp;
                var percentage = observationsToCoercionPercentage(obsForComp);
                compToPercentage[comps[i]] = percentage;
            }
            plots.plotHistogram(compToPercentage, "libsVsOthers_" + mode, "% coercions over all operations");
        });
    }

    function totalHarmfulLocations(analysisResults) {
        var locations = Object.keys(util.arrayToSet(analysisResults.observations.filter(f.obs.isHarmful).map(m.obs.toUniqueLocation))).length;
        macros.writeMacro("totalHarmfulLocations", locations);
    }

    exports.byType = byType;
    exports.byBenchmarkGroup = byBenchmarkGroup;
    exports.byBenchmark = byBenchmark;
    exports.harmfulByBenchmarkGroup = harmfulByBenchmarkGroup;
    exports.harmfulByBenchmark = harmfulByBenchmark;
    exports.harmfulByType = harmfulByType;
    exports.overallPercentageHarmful = overallPercentageHarmful;
    exports.callsWithCoercioRatio = callsWithCoercionPercentage;
    exports.libsVsOthers = libsVsOthers;
    exports.totalHarmfulLocations = totalHarmfulLocations;

})();