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
    var visualizeAllTypes = true;
    var visualizeWarningTypes = true;

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function TypeData(typeNameToFieldTypes, functionToSignature, typeNames, functionNames) {
        this.typeNameToFieldTypes = typeNameToFieldTypes;
        this.functionToSignature = functionToSignature;
        this.typeNames = typeNames;
        this.functionNames = functionNames;
    }

    function mergeTypeData(typeData, typeNameToFieldTypes, functionToSignature, typeNames, functionNames) {
        mergeToLeft(typeData.typeNameToFieldTypes, typeNameToFieldTypes, typeNames, functionNames);
        mergeToLeft(typeData.functionToSignature, functionToSignature, typeNames, functionNames);
    }

    function mergeToLeft(left, right) {
        if (right === true) {
            return true;
        }
        Object.keys(right).forEach(function(rKey) {
            if (util.HOP(left, rKey)) {
                left[rKey] = mergeToLeft(left[rKey], right[rKey]);
            } else {
                left[rKey] = right[rKey];
            }
        });
        return left;
    }

    function WarningStats(typeWarnings, functionWarnings, typeWarningsByLoc, functionWarningsByLoc) {
        this.typeWarnings = typeWarnings;
        this.functionWarnings = functionWarnings;
        this.typeWarningsByLoc = typeWarningsByLoc;
        this.functionWarningsByLoc = functionWarningsByLoc;
    }

    WarningStats.prototype.toString = function() {
        return this.typeWarnings + "," + this.functionWarnings + "," + this.typeWarningsByLoc + "," + this.functionWarningsByLoc;
    };

    WarningStats.prototype.headerString = function() {
        return "typeWarnings,functionWarnings,typeWarningsByLoc,functionWarningsByLoc";
    };

    function analyze(loggedResults, sourcemapDir) {
        var benchmark2TypeData = {};
        loggedResults.forEach(function(loggedResult) {
            var benchmark = benchmarkHelper.urlToBenchmark(loggedResult.url);
            var typeData = benchmark2TypeData[benchmark] || new TypeData({}, {}, {}, {});
            mergeTypeData(typeData, loggedResult.value.typeNameToFieldTypes, loggedResult.value.functionToSignature,
                  loggedResult.value.typeNames, loggedResult.value.functionNames);
            benchmark2TypeData[benchmark] = typeData;
        });

        for (var benchmark in benchmark2TypeData) {
            console.log("========== Benchmark: " + benchmark + " ============");
            var typeData = benchmark2TypeData[benchmark];
            console.log(Object.keys(typeData.typeNameToFieldTypes).length + " types, " + Object.keys(typeData.functionToSignature).length + " functions");
            var iids = offlineCommon.loadIIDs(sourcemapDir);
            var iidFct = function(iid) {
                var triple = iids[iid];
                return triple ? triple.toString() : "<unknown location>";
            };
            var warnings = typeAnalysis.analyzeTypes(typeData.typeNameToFieldTypes, typeData.functionToSignature, typeData.typeNames, typeData.functionNames, iidFct,
                  false, visualizeAllTypes, visualizeWarningTypes);
            var typeWarnings = warnings[0];
            var functionWarnings = warnings[1];

            warningStats(typeWarnings, functionWarnings);
            console.log();
            analyzeFunctionWarnings(functionWarnings);
            analyzeTypeWarnings(typeWarnings);
        }
    }

    function warningStats(typeWarnings, functionWarnings) {
        // merge by location
        var locToTypeWarnings = {};
        typeWarnings.forEach(function(warning) {
            var warningsAtLoc = locToTypeWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToTypeWarnings[warning.typeDescription.location] = warningsAtLoc;
        });
        var locToFunctionWarnings = {};
        functionWarnings.forEach(function(warning) {
            var warningsAtLoc = locToFunctionWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToFunctionWarnings[warning.typeDescription.location] = warningsAtLoc;
        });

        var warningStats = new WarningStats(typeWarnings.length, functionWarnings.length,
              Object.keys(locToTypeWarnings).length, Object.keys(locToFunctionWarnings).length);
        console.log(warningStats.headerString());
        console.log(warningStats.toString());
    }

    function analyzeFunctionWarnings(functionWarnings) {
        console.log("@@@ Analyzing function warnings:");

        // merge by location of function definition
        var locToFunctionWarnings = {};
        functionWarnings.forEach(function(warning) {
            var warningsAtLoc = locToFunctionWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToFunctionWarnings[warning.typeDescription.location] = warningsAtLoc;
        });

        // group by caller component and callee component
        var componentsToWarnings = {}; // string of format "callerComponent->calleeComponent" -> array of InconsistentTypeWarning
        Object.keys(locToFunctionWarnings).forEach(function(functionLoc) {
            var warningsForFunction = locToFunctionWarnings[functionLoc];
            warningsForFunction.forEach(function(warningForFunction) {
                var calleeLoc = warningForFunction.typeDescription.location;
                var calleeComponent = benchmarkHelper.locationToComponent(calleeLoc);
                var callerComponent = benchmarkHelper.locationToComponent(functionLoc);
                var components = callerComponent + "->" + calleeComponent;

                var warningsForComponents = componentsToWarnings[components] || [];
                warningsForComponents.push(warningForFunction);
                componentsToWarnings[components] = warningsForComponents;
            });
        });

        console.log("Warnings: " + functionWarnings.length);
        console.log("Functions with warnings: " + Object.keys(locToFunctionWarnings).length);
        console.log();
        console.log("Grouped by components (function warnings):");
        Object.keys(componentsToWarnings).forEach(function(components) {
            var warningsForComponents = componentsToWarnings[components];
            console.log("  " + components + " : " + warningsForComponents.length);
        });

        var toInspect = [];
        Object.keys(componentsToWarnings).forEach(function(components) {
            var warningsForComponents = componentsToWarnings[components];
            if (components.indexOf("other") !== -1) {
                warningsForComponents.forEach(function(w) {
                    var warningIds = [];
                    var calleeLoc = w.typeDescription.location;
                    w.observedTypesAndLocations.forEach(function(typeAndLocs) {
                        var callSites = typeAndLocs[1];
                        callSites.forEach(function(callSite) {
                            warningIds.push(callSite + " --> " + calleeLoc);
                        });
                    });
                    toInspect.push(new inspector.Warning(w.toString(), warningIds));
                });
            }
        });
        inspector.inspect(toInspect, inspectedWarningsFile);
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
            if (component !== "jquery") {
                var warningIds = [];
                var warningText = "";
                var warningsForLoc = locToTypeWarnings[loc];
                warningsForLoc.forEach(function(warning) {
                    warningText += warning.toString() + "\n";
                    warning.observedTypesAndLocations.forEach(function(typeAndLocs) {
                        var observedType = typeAndLocs[0].location;
                        var warningId = warning.fieldName + " of " + warning.typeDescription.location + " has type " + observedType;
                        warningIds.push(warningId);
                    });
                });
                toInspect.push(new inspector.Warning(warningText, warningIds));
            }
        });
        inspector.inspect(toInspect, inspectedWarningsFile);
    }

    var benchmarkDir = process.argv[2];
    var loggedResults = readFile(benchmarkDir + "/analysisResults.json");
    var sourcemapDir = benchmarkDir+"/sourcemaps/";
    analyze(loggedResults, sourcemapDir);

})();