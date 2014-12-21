// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var plots = require('./Plots.js');
    var tables = require('./Tables.js');
    var util = require("./CommonUtil.js");
    var macros = require('./Macros.js');

    function consistentCoercions(analysisResults) {
        var iidToTypeSummaries = summarizeTypesAtCoercions(analysisResults.observations);
        var nbTypesToNbIIDs = {};
        var bags = ["1", "2", "3-5", "6-10", ">10"];
        var iids = Object.keys(iidToTypeSummaries);
        for (i = 0; i < iids.length; i++) {
            var nbTypes = iidToTypeSummaries[iids[i]].length;
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

        var percentageMonomorphic = nbTypesToNbIIDs["1"] * 100 / iids.length;
        macros.writeMacro("percentageMonomorphic", util.roundPerc(percentageMonomorphic) + "\\%");

        var percentageThreeOrMore = (iids.length - nbTypesToNbIIDs["1"] - nbTypesToNbIIDs["2"]) * 100 / iids.length;
        macros.writeMacro("percentageLocationsWithThreeOrMoreCoercions", util.roundPerc(percentageThreeOrMore) + "\\%");
    }

    function summarizeTypesAtCoercions(allObservations) {
        var observationsWithCoercions = allObservations.filter(f.obs.isCoercion);
        // fill it
        var iidToTypeSummaries = {};
        for (var i = 0; i < observationsWithCoercions.length; i++) {
            var obs = observationsWithCoercions[i];
            var typeSummaries = iidToTypeSummaries[obs.iid] || {};
            typeSummaries[m.obs.toTypeSummary(obs)] = true;
            iidToTypeSummaries[obs.iid] = typeSummaries;
        }
        // turn type summaries into sorted arrays (to avoid double counting)
        var iids = Object.keys(iidToTypeSummaries);
        for (var i = 0; i < iids.length; i++) {
            var typeSummary = iidToTypeSummaries[iids[i]];
            typeSummary = Object.keys(typeSummary).sort();
            iidToTypeSummaries[iids[i]] = typeSummary;
        }

        return iidToTypeSummaries;
    }

    function summarizeOperators(observations) {
        var iidToOperators = {};
        for (var i = 0; i < observations.length; i++) {
            var op = m.obs.toOperator(observations[i]);
            iidToOperators[observations[i].iid] = op;
        }
        return iidToOperators;
    }

    function polymorphicCoercions(analysisResults) {
        var observationsWithCoercions = analysisResults.observations.filter(f.obs.isCoercion);
        var iidToTypeSummaries = summarizeTypesAtCoercions(observationsWithCoercions);
        var polymorphicIIDs = {};
        Object.keys(iidToTypeSummaries).forEach(function(iid) {
            var nbTypes = iidToTypeSummaries[iid].length;
            if (nbTypes > 1) polymorphicIIDs[iid] = true;
        });

        var iidToOperator = summarizeOperators(observationsWithCoercions);

        var opAndTypeSummaryToNbIIDs = {};
        var polymorphicIIDs = Object.keys(polymorphicIIDs);
        for (var i = 0; i < polymorphicIIDs.length; i++) {
            var iid = polymorphicIIDs[i];
            var opAndTypeSummary = iidToOperator[iid] + "@@@" + iidToTypeSummaries[iid].join(", ");
            opAndTypeSummaryToNbIIDs[opAndTypeSummary] = (opAndTypeSummaryToNbIIDs[opAndTypeSummary] || 0) + 1;
        }

        var summariesAndNbIIDs = [];
        var summaries = Object.keys(opAndTypeSummaryToNbIIDs);
        for (i = 0; i < summaries.length; i++) {
            summariesAndNbIIDs.push({summary:summaries[i], nbIIDs:opAndTypeSummaryToNbIIDs[summaries[i]]});
        }
        summariesAndNbIIDs.sort(function(a, b) {
            return b.nbIIDs - a.nbIIDs;
        });

        var totalPolymorphic = 0;
        var condRelated = 0;
        for (i = 0; i < summariesAndNbIIDs.length; i++) {
            var op = summariesAndNbIIDs[i].summary.split("@@@")[0];
            var nbIIDs = summariesAndNbIIDs[i].nbIIDs;
            if (op === "conditional" || op === "!" || op === "&&" || op === "||") condRelated += nbIIDs;
            totalPolymorphic += nbIIDs;
        }
        var percentagePolymorphicAndConditionalRelated = condRelated * 100 / totalPolymorphic;
        macros.writeMacro("percentagePolymorphicAndConditionalRelated", util.roundPerc(percentagePolymorphicAndConditionalRelated) + "\\%");

        var headerRow = ["Operation", "Coerced types", "Locations"];
        var dataRows = [];
        summariesAndNbIIDs = summariesAndNbIIDs.slice(0, Math.min(summariesAndNbIIDs.length, 10));
        for (i = 0; i < summariesAndNbIIDs.length; i++) {
            var kindAndTypes = summariesAndNbIIDs[i].summary.split("@@@");
            var nbIIDs = summariesAndNbIIDs[i].nbIIDs;
            dataRows.push([kindAndTypes[0], kindAndTypes[1], nbIIDs]);
        }
        tables.writeTable(headerRow, dataRows, "polymorphic_coercions", {alignment:"p{10em}p{12em}l"});
    }

    exports.consistentCoercions = consistentCoercions;
    exports.polymorphicCoercions = polymorphicCoercions;

})
();