(function() {

    // imports
    var fs = require('fs');
    var typeAnalysis = require('./TypeAnalysis.js');
    var offlineCommon = require('../OfflineAnalysesCommon.js');
    var util = require('../CommonUtil.js');
    var inspector = require('../WarningInspector.js');
    var benchmarkHelper = require('./BenchmarkHelper.js');

    // parameters
    var inspectedWarningsFile = "/home/m/research/experiments/inconsistentTypes/inspectedWarnings.json";
    var visualizeAllTypes = false;
    var visualizeWarningTypes = true;

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function TypeData(typeNameToFieldTypes, typeNames, callGraph, frameToBeliefs) {
        this.typeNameToFieldTypes = typeNameToFieldTypes;
        this.typeNames = typeNames;
        this.callGraph = callGraph;
        this.frameToBeliefs = frameToBeliefs;
    }

    function mergeTypeData(allTypeData, typeData) {
        util.mergeToLeft(allTypeData.typeNameToFieldTypes, typeData.typeNameToFieldTypes);
        util.mergeToLeft(allTypeData.typeNames, typeData.typeNames);
        util.mergeToLeft(allTypeData.callGraph, typeData.callGraph);
        util.mergeToLeft(allTypeData.frameToBeliefs, typeData.frameToBeliefs);
    }

    function ResultSummary(name) {
        this.name = name;
        this.typesAll = -1;
        this.typesMerged = -1;
        this.inconsistentTypes = -1;
        this.warnings = -1;
        this.bugs = -1;
    }

    ResultSummary.prototype.toString = function() {
        return this.name + "," + this.typesAll + "," + this.typesMerged + "," + this.inconsistentTypes + "," + this.warnings + "," + this.bugs;
    };

    function analyze(loggedResults, sourcemapDir) {
        var benchmark2TypeData = {};
        loggedResults.forEach(function(loggedResult) {
            var benchmark = benchmarkHelper.urlToBenchmark(loggedResult.url);
            var typeData = benchmark2TypeData[benchmark] || new TypeData({}, {}, {}, {});
            mergeTypeData(typeData, loggedResult.value);
            benchmark2TypeData[benchmark] = typeData;
        });

        for (var benchmark in benchmark2TypeData) {
            var resultSummary = new ResultSummary(benchmark);
            console.log("========== Benchmark: " + benchmark + " ============");
            var typeData = benchmark2TypeData[benchmark];
            console.log(Object.keys(typeData.typeNameToFieldTypes).length + " types");
            var iids = offlineCommon.loadIIDs(sourcemapDir);
            var iidFct = function(iid) {
                var triple = iids[iid];
                return triple ? triple.toString() : "<unknown location>";
            };
            var typeWarnings = typeAnalysis.analyzeTypes(typeData, iidFct, false, visualizeAllTypes, visualizeWarningTypes, resultSummary);
            resultSummary.warnings = typeWarnings.length;

            analyzeWarnings(typeWarnings, resultSummary);

            console.log("ResultSummary: " + resultSummary.toString());
        }
    }

    function analyzeWarnings(warnings, resultSummary) {
        console.log("@@@ Analyzing type warnings:");

        resultSummary.bugs = 0;

        var toInspect = [];
        warnings.forEach(function(w) {
            var warningIds = {}; // string->true
            var warningNbs = {}; // number->true
            var warningText = w.toString() + "\n";
            w.observedTypesAndLocations.forEach(function(typeAndLocs) {
                if (w.typeDescription.kind === "function") {
                    // function warnings: list each (caller,callee) pair only once
                    var callSites = typeAndLocs[1];
                    var calleeLoc = w.typeDescription.location;
                    callSites.forEach(function(callSite) {
                        warningIds[callSite + " --> " + calleeLoc] = true;
                    });
                } else {
                    // non-function warnings: list each type
                    var observedType = typeAndLocs[0].location;
                    var warningId = w.fieldName + " of " + w.typeDescription.location + " has type " + observedType;
                    warningIds[warningId] = true;
                }
            });
            warningNbs[w.id] = true;
            toInspect.push(new inspector.Warning(warningText, warningIds, warningNbs));
        });
        inspector.inspect(toInspect, inspectedWarningsFile, resultSummary);
    }

    var benchmarkDir = process.argv[2];
    var loggedResults = readFile(benchmarkDir + "/analysisResults.json");
    var sourcemapDir = benchmarkDir + "/sourcemaps/";
    analyze(loggedResults, sourcemapDir);

})();