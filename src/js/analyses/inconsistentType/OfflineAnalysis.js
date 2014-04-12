(function() {

    var fs = require('fs');
    var typeAnalysis = require('./TypeAnalysis.js');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }

    function analyze(loggedResults) {
        loggedResults.forEach(function(loggedResult) {
            var typeNameToFieldTypes = loggedResult.value.typeNameToFieldTypes;
            var functionToSignature = loggedResult.value.functionToSignature;
            var iids = loggedResult.value.iids;
            typeAnalysis.analyzeTypes(typeNameToFieldTypes, functionToSignature, iids);
        });
    }

    var loggedResults = readFile(process.argv[2]);
    console.log(loggedResults);
    analyze(loggedResults);

})();