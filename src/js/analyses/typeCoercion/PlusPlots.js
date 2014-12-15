// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var plots = require('./Plots.js');
    var util = require("./CommonUtil.js");

    function kindsOfCoercions(allObservations) {
        ["static", "dynamic"].forEach(function(mode) {
            var strAndClassAndFreqs = allObservations.filter(f.obs.isBinaryPlus).map(m.obs.toAbstractAllStringAndClassificationAndFreq);
            strAndClassAndFreqs = mode === "static" ? strAndClassAndFreqs.map(m.strAndClassAndFreq.toStatic) : strAndClassAndFreqs;


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
        });
    }

    exports.kindsOfCoercions = kindsOfCoercions;

})();