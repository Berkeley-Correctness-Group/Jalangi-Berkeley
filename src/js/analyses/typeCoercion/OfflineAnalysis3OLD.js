// Author: Michael Pradel

(function() {

    var nbBasic = require('numbers').basics;
    var nbStats = require('numbers').statistic;

    function typesOfObservation(obs) {
        var types = [];
        if (util.HOP(obs, "type")) { // unary and conditional
            types.push(obs.type);
        } else { // binary
            types.push(obs.leftType);
            types.push(obs.rightType);
        }
        return types;
    }

    function typesAndOperators(obsAndFreq) {
        var hashToObservations = obsAndFreq[0];
        var typesAndOps = {}; // string --> true
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var s;
                if (obs.kind === "binary") {
                    s = obs.leftType + " " + obs.operation + " " + obs.leftType;
                } else { // conditional or unary
                    s = obs.operation + " " + obs.type;
                }
                typesAndOps[s] = true;
            }
        });
        Object.keys(typesAndOps).forEach(function(s) {
            console.log(s);
        });
    }

    function PrevalenceResults(conditionalHisto, unaryHisto, binaryHisto) {
        this.conditionalHisto = conditionalHisto;
        this.unaryHisto = unaryHisto;
        this.binaryHisto = binaryHisto;
    }

    PrevalenceResults.prototype.percentageOfType = function(type) {
        var totalOps = 0;
        var coercionOps = 0;
        ["conditionalHisto", "unaryHisto", "binaryHisto"].forEach(function(histoProp) {
            var histo = this[histoProp];
            totalOps += totalOfHisto(histo);
            coercionOps += (totalOfHisto(histo) - (histo.none !== undefined ? histo.none : 0));
        });
        return totalOps > 0 ? coercionOps / totalOps : 0;
    };

    function prevalenceOfCoercionsDynamic(obsAndFreq, mode, caption, plot, toIgnore) {
        if (caption)
            console.log("\n====== " + caption + " ======\n");
        var hashToObservations = obsAndFreq[0];
        var hashToFrequency = obsAndFreq[1];
        var conditionalCoercionToFreq = {};
        var unaryCoercionToFreq = {};
        var binaryCoercionToFreq = {};
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var coercion = coercionOfObservation(obs, mode);
                var map = obs.kind === "conditional" ? conditionalCoercionToFreq : (obs.kind === "unary" ? unaryCoercionToFreq : binaryCoercionToFreq);
                var oldFreq = map[coercion] || 0;
                map[coercion] = oldFreq + hashToFrequency[hash];
            }
        });
        if (toIgnore) {
            Object.keys(toIgnore).forEach(function(ignored) {
                delete conditionalCoercionToFreq[ignored];
                delete unaryCoercionToFreq[ignored];
                delete binaryCoercionToFreq[ignored];
            });
        }
        if (caption) {
            printHistogram("Conditionals", conditionalCoercionToFreq);
            printHistogram("Unary", unaryCoercionToFreq);
            printHistogram("Binary", binaryCoercionToFreq);
        }
        if (plot) {
            var mergedHisto = util.mergeToLeft(util.mergeToLeft(util.mergeToLeft({}, conditionalCoercionToFreq), unaryCoercionToFreq), binaryCoercionToFreq);
            plots.plotHistogram(mergedHisto, caption.replace(/ /g, "_"), "Percentage", {wide:true});
        }
        return new PrevalenceResults(conditionalCoercionToFreq, unaryCoercionToFreq, binaryCoercionToFreq);
    }

    function prevalenceOfCoercionsStatic(obsAndFreq, mode, caption, plot, toIgnore) {
        function countLocs(coercionToLocs) {
            Object.keys(coercionToLocs).forEach(function(coercion) {
                var nbLocs = Object.keys(coercionToLocs[coercion]).length;
                coercionToLocs[coercion] = nbLocs;
            });
        }

        if (caption)
            console.log("\n====== " + caption + " ======\n");
        var hashToObservations = obsAndFreq[0];
        var conditionalCoercionToLocs = {};
        var unaryCoercionToLocs = {};
        var binaryCoercionToLocs = {};
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var coercion = coercionOfObservation(obs, mode);
                var map = obs.kind === "conditional" ? conditionalCoercionToLocs : (obs.kind === "unary" ? unaryCoercionToLocs : binaryCoercionToLocs);
                var locsWithCoercion = map[coercion] || {};
                locsWithCoercion[obs.location] = true;
                map[coercion] = locsWithCoercion;
            }
        });
        countLocs(conditionalCoercionToLocs);
        countLocs(unaryCoercionToLocs);
        countLocs(binaryCoercionToLocs);
        if (toIgnore) {
            Object.keys(toIgnore).forEach(function(ignored) {
                delete conditionalCoercionToLocs[ignored];
                delete unaryCoercionToLocs[ignored];
                delete binaryCoercionToLocs[ignored];
            });
        }
        if (caption) {
            printHistogram("Conditionals", conditionalCoercionToLocs);
            printHistogram("Unary", unaryCoercionToLocs);
            printHistogram("Binary", binaryCoercionToLocs);
        }
        if (plot) {
            var mergedHisto = util.mergeToLeft(util.mergeToLeft(util.mergeToLeft({}, conditionalCoercionToLocs), unaryCoercionToLocs), binaryCoercionToLocs);
            plots.plotHistogram(mergedHisto, caption.replace(/ /g, "_"), "Percentage", {wide:true});
        }
        return new PrevalenceResults(conditionalCoercionToLocs, unaryCoercionToLocs, binaryCoercionToLocs);
    }

    function PrevalenceResultsMulti(groupToConditionalHisto, groupToUnaryHisto, groupToBinaryHisto) {
        this.groupToConditionalHisto = groupToConditionalHisto;
        this.groupToUnaryHisto = groupToUnaryHisto;
        this.groupToBinaryHisto = groupToBinaryHisto;
    }

    function prevalenceOfCoercionsMultiple(caption, dynamic, mode, groupToObsAndFreq, outputFct) {
        console.log("\n====== " + caption + " ====== \n");
        var groupToConditionalHisto = {};
        var groupToUnaryHisto = {};
        var groupToBinaryHisto = {};
        var prevalenceAnalysisFct = dynamic ? prevalenceOfCoercionsDynamic : prevalenceOfCoercionsStatic;
        Object.keys(groupToObsAndFreq).forEach(function(group) {
            var prevalenceResults = prevalenceAnalysisFct(groupToObsAndFreq[group], mode);
            groupToConditionalHisto[group] = prevalenceResults.conditionalHisto;
            groupToUnaryHisto[group] = prevalenceResults.unaryHisto;
            groupToBinaryHisto[group] = prevalenceResults.binaryHisto;
        });
        outputFct("Conditionals", groupToConditionalHisto);
        outputFct("Unary", groupToUnaryHisto);
        outputFct("Binary", groupToBinaryHisto);
        return new PrevalenceResultsMulti(groupToConditionalHisto, groupToUnaryHisto, groupToBinaryHisto);
    }

    function polymorphicCodeLocations(obsAndFreq) {
        console.log("\n====== Are code locations polymorphic? ======\n");
        var hashToObservations = obsAndFreq[0];
        var locationToCoercedTypes = {}; // string --> string --> true
        var locationToUncoercedTypes = {}; // string --> string --> true
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var types = typesOfObservation(obs).toString();
                var coercion = coercionOfObservation(obs, "string");
                var locationToTypes = coercion === "none" ? locationToUncoercedTypes : locationToCoercedTypes;
                var typesAtLocation = locationToTypes[obs.location] || {};
                typesAtLocation[types] = true;
                locationToTypes[obs.location] = typesAtLocation;
            }
        });
        var nbTypesToFreqAllLocations = {};
        var nbTypesToFreqLocationsWithCoercion = {};
        Object.keys(locationToUncoercedTypes).forEach(function(location) {
            var typesAtLocation = locationToUncoercedTypes[location];
            var nbTypes = Object.keys(typesAtLocation).length;
            nbTypesToFreqAllLocations[nbTypes] = 1 + (nbTypesToFreqAllLocations[nbTypes] || 0);
        });
        Object.keys(locationToCoercedTypes).forEach(function(location) {
            var typesAtLocation = locationToCoercedTypes[location];
            var nbTypes = Object.keys(typesAtLocation).length;
            nbTypesToFreqAllLocations[nbTypes] = 1 + (nbTypesToFreqAllLocations[nbTypes] || 0);
            nbTypesToFreqLocationsWithCoercion[nbTypes] = 1 + (nbTypesToFreqLocationsWithCoercion[nbTypes] || 0);
        });
        printHistogram("Frequency of nb of different types per location (all locations)", nbTypesToFreqAllLocations);
        printHistogram("Frequency of nb of different types per location (locations with coercion)", nbTypesToFreqLocationsWithCoercion);
    }

    function equalityOperationsDynamic(obsAndFreq) {
        console.log("\n====== (In)equality operators (dynamic) ======\n");
        var hashToObservations = obsAndFreq[0];
        var hashToFrequency = obsAndFreq[1];
        var triple = {sameTypes:0, differentTypes:0};
        var double = {sameTypes:0, differentTypes:0};
        var tripleToDoubleChangesOutcome = 0;
        var doubleToTripleChangesOutcome = 0;
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var freq = hashToFrequency[hash];
                if (obs.operation === "===" || obs.operation === "!==") {
                    if (obs.leftType === obs.rightType) {
                        triple.sameTypes += freq;
                    } else {
                        triple.differentTypes += freq;
                    }
                    if (obs.resultValue !== obs.alternativeResultValue) {
                        tripleToDoubleChangesOutcome += freq;
                    }
                } else if (obs.operation === "==" || obs.operation === "!=") {
                    if (obs.leftType === obs.rightType) {
                        double.sameTypes += freq;
                    } else {
                        double.differentTypes += freq;
                    }
                    if (obs.resultValue !== obs.alternativeResultValue) {
                        doubleToTripleChangesOutcome += freq;
                    }
                }
            }
        });
        printHistogram("Strict equals", triple);
        console.log("  Non-strict equals changes outcome: " + absAndPerc(tripleToDoubleChangesOutcome, triple.sameTypes + triple.differentTypes) + "\n");
        printHistogram("Non-strict equals", double);
        console.log("  Strict equals changes outcome: " + absAndPerc(doubleToTripleChangesOutcome, double.sameTypes + double.differentTypes) + "\n");
    }

    function equalityOperationsStatic(obsAndFreq) {
        function updateInfos(infos, obs) {
            if (obs.leftType === obs.rightType) {
                infos.sameTypes = true;
            } else {
                infos.differentTypes = true;
            }
            if (obs.resultValue !== obs.alternativeResultValue) {
                infos.changeChangesOutcome = true;
            } else {
                infos.changeMaintainsOutcome = true;
            }
        }

        console.log("\n====== (In)equality operators (static) ======\n");
        var hashToObservations = obsAndFreq[0];
        var locationToInfos = {};  // infos: {operation:string, sameTypes:boolean, differentTypes:boolean, changeChangesOutcome:boolean, changeMaintainsOutcome:boolean}
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind !== "explicit") {
                var infos = locationToInfos[obs.location] || {operation:obs.operation};
                if (obs.operation === "===" || obs.operation === "!==" || obs.operation === "==" || obs.operation === "!=") {
                    updateInfos(infos, obs);
                }
                locationToInfos[obs.location] = infos;
            }
        });

        var typesForStrict = {alwaysSame:0, alwaysDifferent:0, both:0};
        var changesForStrict = {alwaysChanges:0, neverChanges:0, sometimesChanges:0};
        var typesForNonStrict = {alwaysSame:0, alwaysDifferent:0, both:0};
        var changesForNonStrict = {alwaysChanges:0, neverChanges:0, sometimesChanges:0};

        Object.keys(locationToInfos).forEach(function(location) {
            var infos = locationToInfos[location];
            var isStrict = (infos.operation === "===" || infos.operation === "!==");
            var typesSummary = isStrict ? typesForStrict : typesForNonStrict;
            var changesSummary = isStrict ? changesForStrict : changesForNonStrict;
            if (infos.sameTypes && !infos.differentTypes)
                typesSummary.alwaysSame++;
            else if (!infos.sameTypes && infos.differentTypes)
                typesSummary.alwaysDifferent++;
            else
                typesSummary.both++;
            if (infos.changeChangesOutcome && !infos.changeMaintainsOutcome)
                changesSummary.alwaysChanges++;
            else if (!infos.changeChangesOutcome && infos.changeMaintainsOutcome)
                changesSummary.neverChanges++;
            else
                changesSummary.sometimesChanges++;
        });

        printHistogram("Same types for strict equality operations", typesForStrict);
        printHistogram("Change of outcome when changing strict equality operator to non-strict", changesForStrict);
        printHistogram("Same types for non-strict equality operations", typesForNonStrict);
        printHistogram("Change of outcome when changing non-strict equality operator to strict", changesForNonStrict);
    }

    function explicitConversions(obsAndFreq) {
        console.log("\n====== Explicit type conversions ======\n");
        var hashToObservations = obsAndFreq[0];
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            if (obs.kind === "explicit") {
                console.log(obs.location);
            }
        });
    }

    function plotPrevalenceSummary(allObsAndFreq) {
        ["dynamic", "static"].forEach(function(dynOrStat) {
            var prevalenceAnalysis = dynOrStat === "dynamic" ? prevalenceOfCoercionsDynamic : prevalenceOfCoercionsStatic;
            var bmGroupToObsAndFreq = groupObservations(allObsAndFreq, byBenchmarkGroup);
            var groupToPercentages = {};
            Object.keys(bmGroupToObsAndFreq).forEach(function(bmGroup) {
                var bmToObsAndFreq = groupObservations(bmGroupToObsAndFreq[bmGroup], byBenchmark);
                var coercionPercentages = []; // one entry per benchmark in this group
                Object.keys(bmToObsAndFreq).forEach(function(bm) {
                    var obsAndFreq = bmToObsAndFreq[bm];
                    var prevalenceResults = prevalenceAnalysis(obsAndFreq, "abstract");
                    var perc = 1 - prevalenceResults.percentageOfType("none");
                    coercionPercentages.push(perc);
                });
                groupToPercentages[bmGroup] = coercionPercentages;
            });
            plots.plotBoxAndWhisker(groupToPercentages, "prevalence_summary_" + dynOrStat, "Coercions among all operations (%)");
        });
    }

    function prevalenceLibs(allObsAndFreqs) {
        var compToObsAndFreq = groupObservations(allObsAndFreqs, byComponent);
        Object.keys(compToObsAndFreq).forEach(function(comp) {
            if (comp !== "other") {
                ["dynamic", "static"].forEach(function(dynOrStat) {
                    var prevalenceAnalysis = dynOrStat === "dynamic" ? prevalenceOfCoercionsDynamic : prevalenceOfCoercionsStatic;
                    var prevalenceResults = prevalenceAnalysis(compToObsAndFreq[comp], "abstract");

                });
            }
        });
    }

    function groupObservations(obsAndFreq, groupForObservationFct) {
        var groupToObsAndFreq = {};
        var hashToObservations = obsAndFreq[0];
        var hashToFreq = obsAndFreq[1];
        Object.keys(hashToObservations).forEach(function(hash) {
            var obs = hashToObservations[hash];
            var group = groupForObservationFct(obs);
            var obsAndFreqOfBenchmark = groupToObsAndFreq[group] || [{}, {}];
            obsAndFreqOfBenchmark[0][hash] = obs;
            var oldFreq = obsAndFreqOfBenchmark[1][hash] || 0;
            obsAndFreqOfBenchmark[1][hash] = oldFreq + hashToFreq[hash];
            groupToObsAndFreq[group] = obsAndFreqOfBenchmark;
        });
        return groupToObsAndFreq;
    }

    function byBenchmark(obs) {
        return obs.benchmark;
    }

    function byBenchmarkGroup(obs) {
        return obs.benchmarkGroup;
    }

    function byLibOrNonLib(obs) {
        return isLibrary(obs.location) ? "lib" : "non-lib";
    }

    function byComponent(obs) {
        return componentOfLocation(obs.location);
    }

    function printHistosPercentages(caption, groupToHisto) {
        var xToPercentages = {}; // string --> array of number
        var allX = {};
        Object.keys(groupToHisto).forEach(function(group) {
            var histo = groupToHisto[group];
            Object.keys(histo).forEach(function(x) {
                allX[x] = true;
            });
        });
        Object.keys(groupToHisto).forEach(function(group) {
            var histo = groupToHisto[group];
            var total = totalOfHisto(histo);
            if (total > 0) {
                Object.keys(allX).forEach(function(x) {
                    var percentages = xToPercentages[x] || [];
                    var nbInHisto = histo[x] || 0;
                    var percentage = Math.round((nbInHisto / total) * 10000) / 100;
                    percentages.push(percentage);
                    xToPercentages[x] = percentages;
                });
            }
        });
        // sort and print
        var entries = [];
        Object.keys(xToPercentages).forEach(function(x) {
            var avgPercentage = nbStats.mean(xToPercentages[x]);
            entries.push({x:x, percentages:xToPercentages[x], mean:avgPercentage});
        });
        entries.sort(function(a, b) {
            return b.avgPercentage - a.avgPercentage;
        });
        console.log(caption);
        entries.forEach(function(e) {
            var sortedPercentages = e.percentages.sort(function(a, b) {
                return b - a;
            });
            console.log("  " + e.x + " --> " + sortedPercentages);
        });
        console.log();
    }

    function totalOfHisto(histo) {
        var total = 0;
        Object.keys(histo).forEach(function(x) {
            total += histo[x];
        });
        return total;
    }

    function printHistosAll(caption, groupToHisto) {
        console.log(caption);
        Object.keys(groupToHisto).forEach(function(group) {
            printHistogram(group, groupToHisto[group]);
        });
    }

    function printHistogram(caption, histogram) {
        var pairs = [];
        var total = 0;
        for (var type in histogram) {
            var nb = histogram[type];
            pairs.push({type:type, nb:nb});
            total += nb;
        }
        var sortedPairs = pairs.sort(function(a, b) {
            return b.nb - a.nb;
        });
        console.log(caption + ", total: " + total);
        sortedPairs.forEach(function(p) {
            console.log("  " + p.type + " --> " + absAndPerc(p.nb, total));
        });
        console.log();
    }

    function absAndPerc(part, total) {
        return part + " (" + Math.round((part / total) * 10000) / 100 + "%)";
    }

    var libraryPatterns = ['jquery', 'mootools', 'bootstrap'];
    function isLibrary(location) {
        for (var i = 0; i < libraryPatterns.length; i++) {
            if (location.indexOf(libraryPatterns[i]) !== -1)
                return true;
        }
        return false;
    }

    function componentOfLocation(location) {
        for (var i = 0; i < libraryPatterns.length; i++) {
            if (location.indexOf(libraryPatterns[i]) !== -1)
                return libraryPatterns[i];
        }
        return "other";
    }

//    typesAndOperators(obsAndFreq);

    // over all benchmarks
//    prevalenceOfCoercionsDynamic(obsAndFreq, "abstract_classify", "Prevalence of type coercions (dynamic)", false, {});
//    prevalenceOfCoercionsStatic(obsAndFreq, "abstract_classify", "Prevalence of type coercions (static)"), false, {};
//    prevalenceOfCoercionsDynamic(obsAndFreq, "abstract", "prevalence_by_type_dynamic", true, {"none":true}); 
//    prevalenceOfCoercionsStatic(obsAndFreq, "abstract", "prevalence_by_type_static", true, {"none":true});

//    polymorphicCodeLocations(obsAndFreq);
//    equalityOperationsDynamic(obsAndFreq);
//    equalityOperationsStatic(obsAndFreq);

    // prevalence summary
//    plotPrevalenceSummary(obsAndFreq);

    // prevalence summary for particular libs
//    prevalenceLibs(obsAndFreq);

    // per benchmark
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by benchmark (dynamic)", true, "abstract", groupObservations(obsAndFreq, byBenchmark), printHistosPercentages);
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by benchmark (static)", false, "abstract", groupObservations(obsAndFreq, byBenchmark), printHistosPercentages);
//
//    // per benchmark group
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by benchmark group (dynamic)", true, "abstract", groupObservations(obsAndFreq, byBenchmarkGroup), printHistosPercentages);
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by benchmark group (static)", false, "abstract", groupObservations(obsAndFreq, byBenchmarkGroup), printHistosPercentages);
//
//    // lib vs non-lib
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by lib/non-lib (dynamic)", true, "abstract", groupObservations(obsAndFreq, byLibOrNonLib), printHistosAll);
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions by lib/non-lib (static)", false, "abstract", groupObservations(obsAndFreq, byLibOrNonLib), printHistosAll);
//
//    // specific libs
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions for specific libs (dynamic)", true, "abstract", groupObservations(obsAndFreq, byComponent), printHistosAll);
//    prevalenceOfCoercionsMultiple("Prevalence of type coercions for specific libs (static)", false, "abstract", groupObservations(obsAndFreq, byComponent), printHistosAll);

    // harmful vs harmless coercions
//    prevalenceOfCoercionsDynamic(obsAndFreq, "classify", "Classification of type coercions (dynamic)");
//    prevalenceOfCoercionsStatic(obsAndFreq, "classify", "Classification of type coercions (static)");

//    explicitConversions(obsAndFreq);    

})();