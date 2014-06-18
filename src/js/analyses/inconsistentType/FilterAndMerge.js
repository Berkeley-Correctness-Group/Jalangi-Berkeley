/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    var util = importModule("CommonUtil");
    var typeUtil = importModule("TypeUtil");
    var benchmarkHelper = importModule("BenchmarkHelper");

    var maxTypes = 2;
    var maxNbDiffEntries = 2;
    var filteredComponents = ["jquery"];

    var PrimitiveTypeNodes;

    // default configuration
    var config = {
        filterByBeliefs:true,
        filterNullRelated:true,
        filterByNbTypes:2, // number of false
        filterByNbTypeDiffEntries:2, // number or false
        mergeViaDataflow:true,
        mergeByTypeDiff:true,
        mergeSameArray:true
    };

    function filterAndMerge(warnings, engineResults, typeGraph, tableAndRoots, PrimitiveTypeNodes_, filterMergeConfig) {
        overrideDefaultConfig(filterMergeConfig);

        PrimitiveTypeNodes = PrimitiveTypeNodes_;
        computeTypeDiffs(warnings, typeGraph, tableAndRoots[0]);
        if (config.filterByBeliefs)
            filterByBeliefs(warnings, engineResults.frameToBeliefs);
        if (config.filterNullRelated)
            filterNullRelated(warnings);
        if (config.filterByNbTypes) {
            maxTypes = config.filterByNbTypes;
            filterByNbTypes(warnings);
        }
        if (config.filterByNbTypeDiffEntries) {
            maxNbDiffEntries = config.filterByNbTypeDiffEntries;
            filterByNbTypeDiffEntries(warnings);
        }
        if (config.mergeViaDataflow)
            mergeViaDataflow(warnings, engineResults.callGraph);
        if (config.mergeByTypeDiff)
            mergeByTypeDiff(warnings);
        if (config.mergeSameArray)
            mergeSameArray(warnings);

        return mergeAndFilterWarnings(warnings);
    }

    function overrideDefaultConfig(config_) {
        for (var key in config_) {
            if (util.HOP(config_, key)) {
                config[key] = config_[key];
            }
        }
    }

    function group(warnings) {
        return groupByLocation(warnings);
    }

    function computeTypeDiffs(warnings, typeGraph, typeToRoot) {
        warnings.forEach(function(w) {
            var observedTypes = w.observedTypes();
            var typeNodes = observedTypes.map(function(typeName) {
                var rootName = typeToRoot[typeName];
                return typeGraph[rootName];
            });
            var diffs = {};
            typeDiff(typeNodes, {}, w.fieldName, diffs);
            w.typeDiff = diffs;
        });
    }

    /**
     * Marks warnings that can be removed due to "beliefs".
     * @param {type} warnings
     * @param {type} frameToBeliefs
     */
    function filterByBeliefs(warnings, frameToBeliefs) {
        warnings.forEach(function(w) {
            var varNameToTypes = frameToBeliefs[w.typeDescription.typeName];
            if (varNameToTypes) {
                var beliefTypes = varNameToTypes[w.fieldName];
                if (beliefTypes) {
                    var observedTypesArray = w.observedTypes();
                    var observedTypesSet = {};
                    observedTypesArray.forEach(function(t) {
                        observedTypesSet[t] = true;
                    });
                    // remove types that the programmer believes to be OK
                    Object.keys(beliefTypes).forEach(function(beliefType) {
                        delete observedTypesSet[beliefType];
                    });
                    if (Object.keys(observedTypesSet).length <= 1) {
                        w.filterBecause.belief = true;
                    }
                }
            }
        });
    }

    /**
     * Mark warnings for removal because they complain about
     * null vs some other type.
     * @param {type} warnings
     */
    function filterNullRelated(warnings) {
        return warnings.filter(function(w) {
            var hasNonNullRelated = Object.keys(w.typeDiff).some(function(diffKey) {
                var diffKinds = w.typeDiff[diffKey].kinds;
                // Variant 1: null vs object/array/function
//                var containsNull = diffKinds.indexOf("null") !== -1;
//                var containsNonObject = diffKinds.some(function(kind) {
//                    return kind !== "object" && kind !== "array" && kind !== "function" && kind !== "null";
//                });
//                return !containsNull || (containsNull && containsNonObject);
                // Variant 2: null vs any other type
                return diffKinds.indexOf("null") === -1;
            });
            if (!hasNonNullRelated) {
                w.filterBecause.nullRelated = true;
            }
        });
    }

    function filterByNbTypes(warnings) {
        warnings.forEach(function(w) {
            if (w.observedTypesAndLocations.length > maxTypes) {
                w.filterBecause.nbTypes = true;
            }
        });
    }

    function filterByNbTypeDiffEntries(warnings) {
        warnings.forEach(function(w) {
            var diffEntries = util.valueArray(w.typeDiff);
            if (diffEntries.length > maxNbDiffEntries) {
                w.filterBecause.nbTypeDiffEntries = true;
            };
        });
    }

    function mergeViaDataflow(warnings, callGraph) {
        function calls(frame1, frame2) {
            return callGraph[frame1] && callGraph[frame1][frame2];
        }

        warnings.forEach(function(w1) {
            warnings.forEach(function(w2) {
                if (w1 !== w2) {
                    var t1 = w1.typeDescription.typeName;
                    var t2 = w2.typeDescription.typeName;
                    var kind1 = w1.typeDescription.kind;
                    var kind2 = w2.typeDescription.kind;
                    var prop1 = w1.fieldName;
                    var prop2 = w2.fieldName;
                    var observed1 = w1.observedTypes();
                    var observed2 = w2.observedTypes();
                    if (util.sameArrays(observed1, observed2)) {
                        if (kind1 === "function" && kind2 === "frame" &&
                              prop1.indexOf("__arg") === 0 && callGraph.frame_fn[t1] === t2) {
                            merge(w1, w2);
                        } else if (kind1 === "frame" && kind2 === "function" &&
                              prop2 === "return" && callGraph.frame_fn[t2] === t1) {
                            merge(w1, w2);
                        } else if (kind1 === "frame" && kind2 === "function" &&
                              prop2.indexOf("__arg") === 0 && calls(t1, callGraph.frame_fn[t2])) {
                            merge(w1, w2);
                        } else if (kind1 === "frame" && kind2 === "frame") {
                            merge(w1, w2);
                        } else if (kind1 === "function" && kind2 === "function" &&
                              prop1 === "return" && prop2 === "return" &&
                              calls(callGraph.frame_fn[t1], callGraph.frame_fn[t2])) {
                            merge(w1, w2);
                        }
                    }
                }
            });
        });
    }

    function mergeSameArray(warnings) {
        var locToWarnings = {};
        warnings.forEach(function(w) {
            if (w.typeDescription.kind === "array") {
                var loc = w.typeDescription.location;
                var warningsAtLoc = locToWarnings[loc] || [];
                warningsAtLoc.forEach(function(otherWarning) {
                    merge(w, otherWarning);
                });
                warningsAtLoc.push(w);
                locToWarnings[loc] = warningsAtLoc;
            }
        });
        return locToWarnings;
    }

    function merge(w1, w2) {
        w1.addMergeWith(w2);
        w2.addMergeWith(w1);
    }

    function groupByLocation(warnings) {
        var locToWarnings = {};
        warnings.forEach(function(w) {
            var loc = w.typeDescription.location;
            var warningsAtLoc = locToWarnings[loc] || [];
            warningsAtLoc.forEach(function(otherWarning) {
                w.addGroupWith(otherWarning);
                otherWarning.addGroupWith(w);
            });
            warningsAtLoc.push(w);
            locToWarnings[loc] = warningsAtLoc;
        });
        return locToWarnings;
    }

    function mergeByTypeDiffCombinatorial(warnings) {
        warnings.forEach(function(w1) {
            var diffEntries1 = util.valueArray(w1.typeDiff);
            warnings.forEach(function(w2) {
                if (w1 !== w2) {
                    if (!w1.willMergeWith(w2) && !w2.willMergeWith(w1)) { // skip type diff comparison if they are merged anyway
                        var diffEntries2 = util.valueArray(w2.typeDiff);
                        if (diffEntries1.length === diffEntries2.length) {
                            // try to find a bijective mapping between the diff entries,
                            // so that e1 and e2 have a common suffix and point to the same types
                            var match = true;
                            for (var i1 = 0; i1 < diffEntries1.length; i1++) {
                                var entry1 = diffEntries1[i1];
                                var exprParts1 = entry1.expr.split(".").slice(1);
                                var entry2;
                                diffEntries2.some(function(entry) {
                                    var exprParts2 = entry.expr.split(".").slice(1);
                                    var haveCommonSuffix = exprParts1.length > 0 && exprParts2.length > 0 && exprParts1[exprParts1.length - 1] === exprParts2[exprParts2.length - 1];
                                    if (haveCommonSuffix && util.sameProps(entry1.kinds, entry.kinds)) {
                                        entry2 = entry;
                                        return true;
                                    }
                                });
                                if (entry2 === undefined) {
                                    match = false;
                                    break;
                                }
                            }
                            // the above algorithm may not find a bijective mapping between diff entries, even though one exists
                            // (but does so for all our benchmarks; will improve it if we find a case where it matters)
                            if (match) {
                                merge(w1, w2);
                            }
                        }
                    }
                }
            });
        });
    }

    function mergeByTypeDiff(warnings) {
        var diffHashToWarnings = {}; // string --> array of warnings
        warnings.forEach(function(w) {
            var diffEntries = util.valueArray(w.typeDiff);
            var hash = diffEntries.length;
            diffEntries.forEach(function(entry) {
                hash += entry.kinds.sort().toString();
            });
            var warningsForHash = diffHashToWarnings[hash] || [];
            warningsForHash.push(w);
            diffHashToWarnings[hash] = warningsForHash;
        });
        for (var hash in diffHashToWarnings) {
            if (util.HOP(diffHashToWarnings, hash)) {
                var warningsForHash = diffHashToWarnings[hash];
                mergeByTypeDiffCombinatorial(warningsForHash);
            }
        }
    }

    /**
     * @param {type} warnings
     * @returns {map} 
     */
    function transitiveClosure(warnings) {
        var idxToFinal = {}; // nb -> nb
        var leaderToIdxs = {}; // nb -> nb -> true
        var i, i1, i2, w1, w2;
        for (i = 0; i < warnings.length; i++) {
            idxToFinal[i] = i;
            var idxs = {};
            idxs[i] = true;
            leaderToIdxs[i] = idxs;
        }

        var changed = true;
        while (changed) {
            changed = false;
            outer: for (i1 = 0; i1 < warnings.length; i1++) {
                w1 = warnings[i1];
                for (i2 = 0; i2 < warnings.length; i2++) {
                    w2 = warnings[i2];
                    if (i1 !== i2 && w1.mergeWith.indexOf(w2) !== -1 && idxToFinal[i1] !== idxToFinal[i2]) {
                        // set final warning of w1 as final warning for w2 and for all warnings that previosuly had w2 as final
                        var newFinal = idxToFinal[i1];
                        var oldFinalOf2 = idxToFinal[i2];
                        idxToFinal[i2] = newFinal;
                        Object.keys(leaderToIdxs[oldFinalOf2]).forEach(function(i3) {
                            idxToFinal[i3] = newFinal;
                            leaderToIdxs[newFinal][i3] = true;
                        });
                        leaderToIdxs[oldFinalOf2] = {};

                        changed = true;
                        break outer;
                    }
                }
            }
        }
        return leaderToIdxs;
    }

    function mergeAndFilterWarnings(warnings) {
        var mergedToIdxs = transitiveClosure(warnings);

        // keep a warning iff none of the warnings in its merge set is marked for removal
        var result = [];
        Object.keys(mergedToIdxs).forEach(function(finalIdx) {
            var idxs = mergedToIdxs[finalIdx];
            if (Object.keys(idxs).length > 0) {
                var mergedWarning = warnings[finalIdx];
                var keep = true;
                // check if any of the warnings this final warning represents is marked for removal
                Object.keys(idxs).forEach(function(inGroupIdx) {
                    if (Object.keys(warnings[inGroupIdx].filterBecause).length > 0)
                        keep = false;
                });
                if (keep)
                    result.push(mergedWarning);
            }
        });

        return result;
    }

    function TypeDiffEntry(expr, kinds) {
        this.expr = expr;
        this.kinds = kinds; // array of string
    }

    TypeDiffEntry.prototype.toString = function() {
        return this.expr + " can be " + this.kinds.toString();
    };

    /**
     * @param {array of TypeNode} rawNodes
     * @param {string --> true} visited
     * @param {string} prefix
     * @param {string --> TypeDiffEntry} result
     */
    function typeDiff(rawNodes, visited, prefix, result) {
        var kindsOfNodes = kinds(rawNodes);
        if (Object.keys(kindsOfNodes).length > 1) {
            var diffEntry = new TypeDiffEntry(prefix, Object.keys(kindsOfNodes));
            result[diffEntry.toString()] = diffEntry;
            return;
        }

        // filter already visited nodes
        var nodes = rawNodes.filter(function(node) {
            return visited[node.name] === undefined;
        });
        // mark nodes as visited
        nodes.forEach(function(node) {
            visited[node.name] = true;
        });
        var fieldNames = allFields(nodes);
        for (var fieldName in fieldNames) {
            if (util.HOP(fieldNames, fieldName)) {
                var newPrefix = prefix + "." + fieldName;
                var targetsOfField = targets(nodes, fieldName);
                if (targetsOfField.length > 1) {
                    var kindsOfField = kinds(targetsOfField);
                    if (Object.keys(kindsOfField).length > 1) {
                        var diffEntry = new TypeDiffEntry(newPrefix, Object.keys(kindsOfField));
                        result[diffEntry.toString()] = diffEntry;
                    } else {
                        typeDiff(targetsOfField, visited, newPrefix, result);
                    }
                }
            }
        }
    }

    function allFields(nodes) {
        var result = {};
        nodes.forEach(function(node) {
            for (var fieldName in node.fieldToTypeNodes) {
                if (util.HOP(node.fieldToTypeNodes, fieldName)) {
                    result[fieldName] = true;
                }
            }
        });
        return result;
    }

    function targets(nodes, fieldName) {
        var nameToNode = {};
        nodes.forEach(function(node) {
            if (util.HOP(node.fieldToTypeNodes, fieldName)) {
                var typeNodes = node.fieldToTypeNodes[fieldName];
                typeNodes.forEach(function(typeNode) {
                    nameToNode[typeNode.name] = typeNode;
                });
            } else {
                nameToNode[PrimitiveTypeNodes.UNDEFINED.name] = PrimitiveTypeNodes.UNDEFINED;
            }
        });

        return util.valueArray(nameToNode);
    }

    function kinds(nodes) {
        var result = {};
        nodes.forEach(function(node) {
            var kind = typeUtil.getKind(node.name);
            result[kind] = true;
        });
        return result;
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$FilterAndMerge = {};
        module = window.$FilterAndMerge;
    }

    function importModule(moduleName) {
        if (typeof exports !== "undefined") {
            return require('./' + moduleName + ".js");
        } else {
            return window['$' + moduleName];
        }
    }

    // exports
    module.filterAndMerge = filterAndMerge;
    module.group = group;

})();