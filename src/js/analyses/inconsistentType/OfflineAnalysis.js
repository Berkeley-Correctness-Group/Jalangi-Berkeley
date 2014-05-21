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
    var maxTypes = 2; // ignore warnings with more than maxTypes different types

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function TypeData(typeNameToFieldTypes, typeNames, callGraph) {
        this.typeNameToFieldTypes = typeNameToFieldTypes;
        this.typeNames = typeNames;
        this.callGraph = callGraph;
    }

    function mergeTypeData(allTypeData, typeData) {
        util.mergeToLeft(allTypeData.typeNameToFieldTypes, typeData.typeNameToFieldTypes);
        util.mergeToLeft(allTypeData.typeNames, typeData.typeNames);
        util.mergeToLeft(allTypeData.callGraph, typeData.callGraph);
    }

    function WarningStats(typeWarnings, typeWarningsByLoc) {
        this.typeWarnings = typeWarnings;
        this.typeWarningsByLoc = typeWarningsByLoc;
    }

    WarningStats.prototype.toString = function() {
        return this.typeWarnings + "," + this.typeWarningsByLoc;
    };

    WarningStats.prototype.headerString = function() {
        return "typeWarnings,typeWarningsByLoc";
    };

    function analyze(loggedResults, sourcemapDir) {
        var benchmark2TypeData = {};
        loggedResults.forEach(function(loggedResult) {
            var benchmark = benchmarkHelper.urlToBenchmark(loggedResult.url);
            var typeData = benchmark2TypeData[benchmark] || new TypeData({}, {}, {});
            mergeTypeData(typeData, loggedResult.value);
            benchmark2TypeData[benchmark] = typeData;
        });

        for (var benchmark in benchmark2TypeData) {
            console.log("========== Benchmark: " + benchmark + " ============");
            var typeData = benchmark2TypeData[benchmark];
            console.log(Object.keys(typeData.typeNameToFieldTypes).length + " types");
            var iids = offlineCommon.loadIIDs(sourcemapDir);
            var iidFct = function(iid) {
                var triple = iids[iid];
                return triple ? triple.toString() : "<unknown location>";
            };
            var typeWarnings = typeAnalysis.analyzeTypes(typeData, iidFct, false, visualizeAllTypes, visualizeWarningTypes);
            
            // TODO only for experimenting
            typeWarnings = filter(typeWarnings);

            warningStats(typeWarnings);
            console.log();
            analyzeTypeWarnings(typeWarnings);
        }
    }

    function filter(warnings) {
        return warnings.filter(function(w) {
            return w.observedTypesAndLocations.length <= maxTypes;
        });
    }

    function warningStats(typeWarnings) {
        // merge by location
        var locToTypeWarnings = {};
        typeWarnings.forEach(function(warning) {
            var warningsAtLoc = locToTypeWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToTypeWarnings[warning.typeDescription.location] = warningsAtLoc;
        });

        var warningStats = new WarningStats(typeWarnings.length, Object.keys(locToTypeWarnings).length);
        console.log(warningStats.headerString());
        console.log(warningStats.toString());
    }

    function analyzeTypeWarnings(typeWarnings) {
        console.log("@@@ Analyzing type warnings:");

        // merge by location
        var locToTypeWarnings = {};
        typeWarnings.forEach(function(warning) {
            var warningsAtLoc = locToTypeWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToTypeWarnings[warning.typeDescription.location] = warningsAtLoc;
        });

        // TODO sort by number of different types observed at a location
        var sortedLocs = Object.keys(locToTypeWarnings);

        var toInspect = [];
        sortedLocs.forEach(function(loc) {
            // focus on non-library warnings
            var component = benchmarkHelper.locationToComponent(loc);
            if (component !== "jquery" && component !== "bootstrap") {
                var warningIds = {}; // string->true
                var warningNbs = {}; // number->true
                var warningText = "";
                var warningsForLoc = locToTypeWarnings[loc];
                warningsForLoc.forEach(function(warning) {
                    warningText += warning.toString() + "\n";
                    warning.observedTypesAndLocations.forEach(function(typeAndLocs) {
                        if (warning.typeDescription.kind === "function") {
                            // function warnings: list each (caller,callee) pair only once
                            var callSites = typeAndLocs[1];
                            var calleeLoc = warning.typeDescription.location;
                            callSites.forEach(function(callSite) {
                                warningIds[callSite + " --> " + calleeLoc] = true;
                            });
                        } else {
                            // non-function warnings: list each type
                            var observedType = typeAndLocs[0].location;
                            var warningId = warning.fieldName + " of " + warning.typeDescription.location + " has type " + observedType;
                            warningIds[warningId] = true;
                        }
                    });
                    warningNbs[warning.id] = true;
                });
                toInspect.push(new inspector.Warning(warningText, warningIds, warningNbs));
            }
        });
        inspector.inspect(toInspect, inspectedWarningsFile);
    }

    var benchmarkDir = process.argv[2];
    var loggedResults = readFile(benchmarkDir + "/analysisResults.json");
    var sourcemapDir = benchmarkDir + "/sourcemaps/";
    analyze(loggedResults, sourcemapDir);

})();