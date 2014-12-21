/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    // poor man's parallelization :-)
    var parallelize = process.argv.length === 3;
    if (parallelize) {
        var workload = parseInt(process.argv[2]);
    }

    var observationParser = require('./ObservationParser.js');
    var util = require("./CommonUtil.js");
    var plots = require('./Plots.js');
    var prevalencePlots = require('./PrevalencePlots.js');
    var equalityPlots = require('./EqualityPlots.js');
    var understandabilityPlots = require('./UnderstandabilityPlots.js');
    var plusPlots = require('./PlusPlots.js');
    var generalStats = require('./GeneralStats.js');

//    var bmGroupDirs = process.argv.slice(2); // directories that contain benchmark directories (e.g., "sunspider" contains "3d-cube")
    var bmGroupDirs = [
        "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/websites_subset"
        //"/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/octane",
        //"/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/sunspider"
    ];
    //var bmGroupDirs = [
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/websites_subset",
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/sunspider",
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/octane"
    //];

    var startTime = new Date().getTime();

    var onlineAnalysisResults = observationParser.parseDirs(bmGroupDirs);
    console.log("Observations: " + onlineAnalysisResults.observations.length);

    // ============ Prevalence of type coercions ===================

    if (!parallelize || workload === 0) {
        // How prevalent are type coercions compared to all operations where coercions may occur?
        prevalencePlots.byBenchmarkGroup(onlineAnalysisResults);

        // Which benchmarks have the most type coercions?
        prevalencePlots.byBenchmark(onlineAnalysisResults);

        // What kinds of type coercions occur?
        prevalencePlots.byType(onlineAnalysisResults);
    }

    if (!parallelize || workload === 1) {
        // How many of all type coercions are potentially harmful?
        prevalencePlots.harmfulByBenchmarkGroup(onlineAnalysisResults);
        prevalencePlots.overallPercentageHarmful(onlineAnalysisResults);

        // Which benchmarks have the most potentially harmful type coercions?
        prevalencePlots.harmfulByBenchmark(onlineAnalysisResults);

        // What kinds of potentially harmful type coercions occur?
        prevalencePlots.harmfulByType(onlineAnalysisResults);

        // What's the total number of potentially harmful code locations?
        prevalencePlots.totalHarmfulLocations(onlineAnalysisResults);
    }

    if (!parallelize || workload === 2) {
        // Which percentage of calls contain at least one coercion?
        prevalencePlots.callsWithCoercioRatio(onlineAnalysisResults);

        // How does the percentage of coercions among all operations differ for particular libs compared to other code?
        //prevalencePlots.libsVsOthers(observations);   // memory problem when analyzing all benchmarks

        // ============ (In)Equality checks ===================

        // At code locations with in(equality) checks, are values of the "same" or different types compared?
        equalityPlots.sameOrDiffTypes(onlineAnalysisResults);

        // How much dynamic information do we have for locations with (in)equality checks?
        equalityPlots.dynamicOccurrencesOfLocs(onlineAnalysisResults);
    }

    if (!parallelize || workload === 3) {

        // =========== Binary plus =======================

        // What kinds of binary plus operations occur?
        plusPlots.kindsOfCoercions(onlineAnalysisResults);


        // ============ Understandability ===================

        // Do code locations with coercions apply always the same coercion?
        understandabilityPlots.consistentCoercions(onlineAnalysisResults);

        // At code locations with polymorphic type coercions, what kinds of coercions occur?
        understandabilityPlots.polymorphicCoercions(onlineAnalysisResults);

        // Nb of observations? Nb of locations w/ observations? Nb of lines of code?
        generalStats.observationStats(onlineAnalysisResults);

    }

    util.printElapsedTime(startTime);

})();
