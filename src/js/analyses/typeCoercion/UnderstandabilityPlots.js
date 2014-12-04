// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var plots = require('./Plots.js');
    var tables = require('./Tables.js');
    var util = require("./CommonUtil.js");

    function consistentCoercions(allObservations) {
        var iidToTypeSummaries = summarizeTypesAtCoercions(allObservations);
        var nbTypesToNbIIDs = {};
        var bags = ["1", "2", "3-5", "6-10", ">10"];
        var iids = Object.keys(iidToTypeSummaries);
        for (i = 0; i < iids.length; i++) {
            var nbTypes = Object.keys(iidToTypeSummaries[iids[i]]).length;
            var bag;
            if (nbTypes === 1)
                bag = "1";
            else if (nbTypes === 2)
                bag = "2";
            else if (nbTypes >= 3 && nbTypes <= 5)
                bag = "3-5";
            else if (nbTypes >= 6 && nbTypes <= 10)
                bag = "6-10";
            else if (nbTypes > 10)
                bag = ">10";
            else throw "Unexpected nb of types: " + nbTypes;

            nbTypesToNbIIDs[bag] = (nbTypesToNbIIDs[bag] || 0) + 1;
        }

        plots.plotHistogram(nbTypesToNbIIDs, "consistency_at_location", "Percentage of type coercions", {
            toPercentages:true,
            xLabel:"Number of different types coerced"
        });
    }

    function summarizeTypesAtCoercions(allObservations) {
        var observationsWithCoercions = allObservations.filter(f.obs.isCoercion);
        var iidToTypeSummaries = {};
        for (var i = 0; i < observationsWithCoercions.length; i++) {
            var obs = observationsWithCoercions[i];
            var typeSummaries = iidToTypeSummaries[obs.iid] || {};
            typeSummaries[m.obs.toTypeSummary(obs)] = true;
            iidToTypeSummaries[obs.iid] = typeSummaries;
        }
        return iidToTypeSummaries;
    }

    function polymorphicCoercions(allObservations) {
        var observationsWithCoercions = allObservations.filter(f.obs.isCoercion);
        var summaryToNbIIDs = {};
        for (var i = 0; i < observationsWithCoercions.length; i++) {
            var summary = m.obs.toOperatorAndTypeSummaryString(observationsWithCoercions[i]);
            summaryToNbIIDs[summary] = (summaryToNbIIDs[summary] || 0) + 1;
        }

        var summariesAndNbIIDs = [];
        var summaries = Object.keys(summaryToNbIIDs);
        for (i = 0; i < summaries.length; i++) {
            summariesAndNbIIDs.push({summary:summaries[i], nbIIDs:summaryToNbIIDs[summaries[i]]});
        }
        summariesAndNbIIDs.sort(function(a, b) {
            return b.nbIIDs - a.nbIIDs;
        });

        var headerRow = ["Kind of coercion", "Types", "Nb. of locations"];
        var dataRows = [];
        summariesAndNbIIDs = summariesAndNbIIDs.slice(0, Math.min(summariesAndNbIIDs.length, 20));
        for (i = 0; i < summariesAndNbIIDs.length; i++) {
            var kindAndTypes = summariesAndNbIIDs[i].summary.split("@@@");
            var nbIIDs = summariesAndNbIIDs[i].nbIIDs;
            dataRows.push([kindAndTypes[0], kindAndTypes[1], nbIIDs]);
        }

        tables.writeTable(headerRow, dataRows, "polymorphic_coercions");
    }

    exports.consistentCoercions = consistentCoercions;
    exports.polymorphicCoercions = polymorphicCoercions;

})
();