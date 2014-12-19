// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var plots = require('./Plots.js');
    var util = require("./CommonUtil.js");
    var macros = require('./Macros.js');

    function kindsOfCoercions(analysisResults) {
        ["static", "dynamic"].forEach(function(mode) {
            var strAndClassAndFreqs = analysisResults.observations.filter(f.obs.isBinaryPlus).map(m.obs.toAbstractAllStringAndClassificationAndFreq);
            strAndClassAndFreqs = mode === "static" ? strAndClassAndFreqs.map(m.strAndClassAndFreq.toStatic) : strAndClassAndFreqs;

            // maybe use if we color the histogram bars according to coercion/harmful/harmless
            //var nonCoercionStrings = util.arrayToSet(strAndClassAndFreqs.filter(f.strAndClassAndFreq.isNonCoercionBinaryPlus)
            //      .map(m.strAndClassAndFreq.toStr));
            //var harmlessStrings = util.arrayToSet(strAndClassAndFreqs.filter(f.strAndClassAndFreq.isHarmless)
            //      .map(m.strAndClassAndFreq.toStr));
            //var harmfulStrings = util.arrayToSet(strAndClassAndFreqs.filter(f.strAndClassAndFreq.isHarmful)
            //      .map(m.strAndClassAndFreq.toStr));

            var strClassAndFreq = strAndClassAndFreqs.map(m.strAndClassAndFreq.toStrClssAndFreq);
            var histo = plots.strAndFreqsToHistogram(strClassAndFreq);
            plots.plotHistogram(histo, "kinds_of_plus_" + mode, "Percentage", {
                toPercentages:true,
                wide:true,
                maxValues:20
            });

            if (mode === "dynamic") {
                var harmful = strAndClassAndFreqs.filter(f.strAndClassAndFreq.isHarmful).reduce(r.strAndClassAndFreq.addFreq, 0);
                var total = strAndClassAndFreqs.reduce(r.strAndClassAndFreq.addFreq, 0);
                macros.writeMacro("percentageHarmfulPlusDynamic", util.roundPerc(harmful*100/total)+"\\%");
            }
        });
    }

    exports.kindsOfCoercions = kindsOfCoercions;

})();