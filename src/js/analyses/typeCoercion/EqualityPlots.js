// Author: Michael Pradel

(function() {

    var m = require('./Mappers.js');
    var f = require('./Filters.js');
    var r = require('./Reducers.js');
    var plots = require('./Plots.js');
    var util = require("./CommonUtil.js");

    var EqualityKinds = {
        DOUBLE:"!= or ==",
        TRIPLE:"!== or ==="
    };

    function sameOrDiffTypes(allObservations) {
        var doubleEqualityObservations = allObservations.filter(f.obs.isDoubleEquality);
        var tripleEqualityObservations = allObservations.filter(f.obs.isTripleEquality);

        var categoryData = new plots.CategoryData();

        analyzeTypeDiffs(doubleEqualityObservations, EqualityKinds.DOUBLE, categoryData);
        analyzeTypeDiffs(tripleEqualityObservations, EqualityKinds.TRIPLE, categoryData);

        plots.plotCategories(categoryData, "equality_same_or_diff_types", "% locations w/ equ. op.");
    }

    function analyzeTypeDiffs(observations, equalityKind, categoryData) {
        var sameTypeFilter = equalityKind === EqualityKinds.DOUBLE ? f.doubleEqObs.sameTypes : f.tripleEqObs.sameTypes;
        var diffTypeFilter = equalityKind === EqualityKinds.DOUBLE ? f.doubleEqObs.diffTypes : f.tripleEqObs.diffTypes;
        var iidsWithSameTypes = iidsWithProperty(observations, sameTypeFilter);
        var iidsWithDiffTypes = iidsWithProperty(observations, diffTypeFilter);
        var iidsWithBoth = util.intersect(iidsWithSameTypes, iidsWithDiffTypes);
        var iidsWithAlwaysSameTypes = util.substractSets(iidsWithSameTypes, iidsWithBoth);
        var iidsWithAlwaysDiffTypes = util.substractSets(iidsWithDiffTypes, iidsWithBoth);

        var allIIDs = util.arrayToSet(observations.map(m.obs.toIID));
        var nbAllIIDs = Object.keys(allIIDs).length;

        var categoryToValue = {};
        categoryToValue["always same"] = Object.keys(iidsWithAlwaysSameTypes).length / nbAllIIDs;
        categoryToValue["mixed"] = Object.keys(iidsWithBoth).length / nbAllIIDs;
        categoryToValue["always different"] = Object.keys(iidsWithAlwaysDiffTypes).length / nbAllIIDs;
        categoryData.addGroup(equalityKind, ["always same", "mixed", "always different"], categoryToValue);
    }

    function iidsWithProperty(observations, filter) {
        var iidSet = {};
        var iidArray = observations.filter(filter).map(m.obs.toIID);
        for (var i = 0; i < iidArray.length; i++) {
            iidSet[iidArray[i]] = true;
        }
        return iidSet;
    }

    function dynamicOccurrencesOfLocs(allObservations) {
        var equalityObservations = allObservations.filter(f.obs.isEquality);
        var iidToNbOccurrences = {};
        for (var i = 0; i < equalityObservations.length; i++) {
            var obs = equalityObservations[i];
            var oldNb = iidToNbOccurrences[obs.iid] || 0;
            iidToNbOccurrences[obs.iid] = oldNb + obs.frequency;
        }
        var bagToNbIIDs = {};
        var iids = Object.keys(iidToNbOccurrences);
        for (i = 0; i < iids.length; i++) {
            var nb = iidToNbOccurrences[iids[i]];
            var bag;
            if (nb === 1) {
                bag = "1"
            } else if (nb > 1 && nb <= 10) {
                bag = "2-10";
            } else if (nb > 10 && nb <= 100) {
                bag = "11-100"
            } else if (nb > 100) {
                bag = ">100";
            } else {
                throw "Unexpected nb of dynamic occurrences of some IID: " + nb;
            }
            bagToNbIIDs[bag] = (bagToNbIIDs[bag] || 0) + nb;
        }

        var order = ["1", "2-10", "11-100", ">100"];
        plots.plotHistogram(bagToNbIIDs, "dynamic_occurrences_of_binary_operation_locations", "% static locations", {
            toPercentages:true,
            order:order
        });
    }

    exports.sameOrDiffTypes = sameOrDiffTypes;
    exports.dynamicOccurrencesOfLocs = dynamicOccurrencesOfLocs;


})();