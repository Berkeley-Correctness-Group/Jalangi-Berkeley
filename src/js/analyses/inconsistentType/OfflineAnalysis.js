(function() {

    // imports
    var fs = require('fs');
    var typeAnalysis = require('./TypeAnalysis.js');
    var offlineCommon = require('../OfflineAnalysesCommon.js');
    var util = require('../CommonUtil.js');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function TypeData(typeNameToFieldTypes, functionToSignature) {
        this.typeNameToFieldTypes = typeNameToFieldTypes;
        this.functionToSignature = functionToSignature;
    }

    function mergeTypeData(typeData, typeNameToFieldTypes, functionToSignature) {
        mergeToLeft(typeData.typeNameToFieldTypes, typeNameToFieldTypes);
        mergeToLeft(typeData.functionToSignature, functionToSignature);
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
        return this.typeWarnings+","+this.functionWarnings+","+this.typeWarningsByLoc+","+this.functionWarningsByLoc;
    };

    function analyze(loggedResults) {
        var benchmark2TypeData = {};
        loggedResults.forEach(function(loggedResult) {
            var urlSuffix = loggedResult.url.slice("http://127.0.0.1/".length);
            var benchmark = urlSuffix.slice(0, urlSuffix.indexOf("/"));
            var typeData = benchmark2TypeData[benchmark] || new TypeData({}, {});
            mergeTypeData(typeData, loggedResult.value.typeNameToFieldTypes, loggedResult.value.functionToSignature);
            benchmark2TypeData[benchmark] = typeData;
        });

        for (var benchmark in benchmark2TypeData) {
            console.log("========== Benchmark: " + benchmark + " ============");
            var typeData = benchmark2TypeData[benchmark];
            console.log(Object.keys(typeData.typeNameToFieldTypes).length + " types, " + Object.keys(typeData.functionToSignature).length + " functions");
            var iids = offlineCommon.loadIIDs();
            var warnings = typeAnalysis.analyzeTypes(typeData.typeNameToFieldTypes, typeData.functionToSignature, iids);
            var typeWarnings = warnings[0];
//            typeWarnings.forEach(function(warning) {
//                console.log(warning.toString());
//            });
            var functionWarnings = warnings[1];
//            functionWarnings.forEach(function(warning) {
//                console.log(warning.toString());
//            });

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
            console.log(warningStats.toString());
        }
    }

    var loggedResults = readFile(process.argv[2]);
    analyze(loggedResults);

})();