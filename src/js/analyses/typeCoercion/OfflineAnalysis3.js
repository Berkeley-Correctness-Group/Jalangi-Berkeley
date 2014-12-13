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

    var observationParser = require('./ObservationParser.js');
    var sets = require('simplesets');
    var util = require("./CommonUtil.js");
    var plots = require('./Plots.js');
    var prevalencePlots = require('./PrevalencePlots.js');
    var equalityPlots = require('./EqualityPlots.js');
    var understandabilityPlots = require('./UnderstandabilityPlots.js');

//    var bmGroupDirs = process.argv.slice(2); // directories that contain benchmark directories (e.g., "sunspider" contains "3d-cube")
    var bmGroupDirs = [
        "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/websites"
    ];
    //var bmGroupDirs = [
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/websites_subset",
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/sunspider",
    //    "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results_nov26_and_older/octane"
    //];

    var onlineAnalysisResults = observationParser.parseDirs(bmGroupDirs);
    var observations = onlineAnalysisResults.observations;
    var bmToMaxCallID = onlineAnalysisResults.bmToMaxCallID;
    console.log("Observations: "+observations.length);

    // ============ Prevalence of type coercions ===================

    // How prevalent are type coercions compared to all operations where coercions may occur?
    prevalencePlots.byBenchmarkGroup(observations);

    // Which benchmarks have the most type coercions?
    prevalencePlots.byBenchmark(observations);

    // What kinds of type coercions occur?
    prevalencePlots.byType(observations);

    // How many of all type coercions are potentially harmful?
    prevalencePlots.harmfulByBenchmarkGroup(observations);

    // Which benchmarks have the most potentially harmful type coercions?
    prevalencePlots.harmfulByBenchmark(observations);

    // What kinds of potentially harmful type coercions occur?
    prevalencePlots.harmfulByType(observations);

    // Which percentage of calls contain at least one coercion?
    prevalencePlots.callsWithCoercioRatio(observations, bmToMaxCallID);

    // ============ (In)Equality checks ===================

    // At code locations with in(equality) checks, are values of the "same" or different types compared?
    equalityPlots.sameOrDiffTypes(observations);

    // How much dynamic information do we have for locations with (in)equality checks?
    equalityPlots.dynamicOccurrencesOfLocs(observations);


    // ============ Understandability ===================

    // Do code locations with coercions apply always the same coercion?
    understandabilityPlots.consistentCoercions(observations);

    // At code locations with polymorphic type coercions, what kinds of coercions occur?
    understandabilityPlots.polymorphicCoercions(observations);


})();
