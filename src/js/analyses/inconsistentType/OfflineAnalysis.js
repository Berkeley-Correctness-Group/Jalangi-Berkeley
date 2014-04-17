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
    var sourcemapDir = "/home/m/research/experiments/inconsistentTypes/benchmarks/joomla/sourcemaps/";

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

    function analyze(loggedResults) {
        var benchmark2TypeData = {};
        loggedResults.forEach(function(loggedResult) {
            var urlSuffix = loggedResult.url.slice("http://127.0.0.1/".length);
            var benchmark = urlSuffix.slice(0, urlSuffix.indexOf("/"));
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
            var warnings = typeAnalysis.analyzeTypes(typeData.typeNameToFieldTypes, typeData.functionToSignature, typeData.typeNames, typeData.functionNames, iids);
            var typeWarnings = warnings[0];
//            typeWarnings.forEach(function(warning) {
//                console.log(warning.toString());
//            });
            var functionWarnings = warnings[1];
//            functionWarnings.forEach(function(warning) {
//                console.log(warning.toString());
//            });


//            analyzeFunctionWarnings(functionWarnings);
            getWarningStats(typeWarnings, functionWarnings);
            analyzeTypeWarnings(typeWarnings);

        }
    }

    function CallWarning(callSiteLoc, fctLoc) {
        this.callSiteLoc = callSiteLoc;
        this.fctLoc = fctLoc;
    }

    function getWarningStats(typeWarnings, functionWarnings) {
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
        // merge by location of function definition
        var locToFunctionWarnings = {};
        functionWarnings.forEach(function(warning) {
            var warningsAtLoc = locToFunctionWarnings[warning.typeDescription.location] || [];
            warningsAtLoc.push(warning);
            locToFunctionWarnings[warning.typeDescription.location] = warningsAtLoc;
        });

        // merge by call site
        var callSiteToWarnings = {}; // string -> array of InconsistentTypeWarning
        functionWarnings.forEach(function(w) {
            w.observedTypesAndLocations.forEach(function(typeAndLocs) {
                var callSites = typeAndLocs[1];
                callSites.forEach(function(callSite) {
                    var warningsForCallSite = callSiteToWarnings[callSite] || [];
                    warningsForCallSite.push(w);
                    callSiteToWarnings[callSite] = warningsForCallSite;
                });
            });
        });

        // group by caller component and callee component
        var componentsToCallWarnings = {}; // string of format "callerComponent->calleeComponent" -> array of CallWarning
        var componentsToWarnings = {}; // string of format "callerComponent->calleeComponent" -> array of InconsistentTypeWarning
        Object.keys(callSiteToWarnings).forEach(function(callSite) {
            var warningsForCallSite = callSiteToWarnings[callSite];
            warningsForCallSite.forEach(function(warningForCallSite) {
                var calleeLoc = warningForCallSite.typeDescription.location;
                var calleeComponent = benchmarkHelper.locationToComponent(calleeLoc);
                var callerComponent = benchmarkHelper.locationToComponent(callSite);
                var components = callerComponent + "->" + calleeComponent;

                var callWarningsForComponents = componentsToCallWarnings[components] || [];
                callWarningsForComponents.push(new CallWarning(callSite, calleeLoc));
                componentsToCallWarnings[components] = callWarningsForComponents;

                var warningsForComponents = componentsToWarnings[components] || [];
                warningsForComponents.push(warningForCallSite);
                componentsToWarnings[components] = warningsForComponents;
            });
        });

        console.log("Warnings: " + functionWarnings.length);
        console.log("Functions with warnings: " + Object.keys(locToFunctionWarnings).length);
        console.log("Call sites with warnings: " + Object.keys(callSiteToWarnings).length);
        console.log();
        console.log("Grouped by components (call warnings):");
        Object.keys(componentsToCallWarnings).forEach(function(components) {
            var warningsForComponents = componentsToCallWarnings[components];
            console.log("  " + components + " : " + warningsForComponents.length);
        });
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

    function analyzeTypeWarnings(allTypeWarnings) {
        var typeWarnings = removeMultipleFunctionsWarnings(allTypeWarnings);

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

    /**
     * Removes each warning about a property that points to
     * multiple different functions
     * @param {array of InconsistentTypeWarning} warnings
     * @returns {array of InconsistentTypeWarning} filtered warnings
     */
    function removeMultipleFunctionsWarnings(warnings) {
        var result = [];
        warnings.forEach(function(w) {
            var includesNonFunction = false;
            w.observedTypesAndLocations.some(function(typeAndLocs) {
                if (typeAndLocs[0].kind !== "function") {
                    return includesNonFunction = true;
                }
            });
            if (includesNonFunction) {
                result.push(w);
            }
        });
        return result;
    }

    var loggedResults = readFile(process.argv[2]);
    analyze(loggedResults);

})();