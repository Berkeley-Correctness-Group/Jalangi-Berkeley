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
    var callGraphModule = importModule("CallGraph");

    var maxTypes = 2;

    var PrimitiveTypeNodes;

    function filterAndMerge(warnings, engineResults, typeGraph, tableAndRoots, PrimitiveTypeNodes_) {
        PrimitiveTypeNodes = PrimitiveTypeNodes_;
        computeTypeDiffs(warnings, typeGraph, tableAndRoots[0]);
        filterByBeliefs(warnings, engineResults.frameToBeliefs);
        filterNullRelated(warnings);
        filterByNbTypes(warnings);
        mergeUsingCallGraph(warnings, engineResults.callGraph);
        mergeByLocation(warnings);

        return produceFinalWarnings(warnings);
    }

    function computeTypeDiffs(warnings, typeGraph, typeToRoot) {
        warnings.forEach(function(w) {
            var observedTypes = w.observedTypesAndLocations.map(function(tl) {
                return tl[0].typeName;
            });
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
                    var observedTypes = {};
                    w.observedTypesAndLocations.forEach(function(tl) {
                        observedTypes[tl[0].typeName] = true;
                    });
                    // remove types that the programmer believes to be OK
                    Object.keys(beliefTypes).forEach(function(beliefType) {
                        delete observedTypes[beliefType];
                    });
                    if (Object.keys(observedTypes).length <= 1) {
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
                var diff = w.typeDiff[diffKey];
                return diff.kinds.indexOf("null") === -1;
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

    function mergeUsingCallGraph(warnings, callGraph) {
        warnings = callGraphModule.markWarningsForMerging(callGraph, warnings);
    }

    function mergeByLocation(warnings) {
        var locToWarnings = {};
        warnings.forEach(function(w) {
            var warningsAtLoc = locToWarnings[w.typeDescription.location] || [];
            warningsAtLoc.forEach(function(otherWarning) {
                w.addMergeWith(otherWarning);
                otherWarning.addMergeWith(w);
            });
            warningsAtLoc.push(w);
            locToWarnings[w.typeDescription.location] = warningsAtLoc;
        });
    }

    function produceFinalWarnings(warnings) {
        // 1) merge warnings (transitive closure)
        var idxToFinal = {}; // nb -> nb
        var finalToIdxs = {}; // nb -> nb -> true
        var i, i1, i2, w1, w2;
        for (i = 0; i < warnings.length; i++) {
            idxToFinal[i] = i;
            var idxs = {};
            idxs[i] = true;
            finalToIdxs[i] = idxs;
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
                        Object.keys(finalToIdxs[oldFinalOf2]).forEach(function(i3) {
                            idxToFinal[i3] = newFinal;
                            finalToIdxs[newFinal][i3] = true;
                        });
                        finalToIdxs[oldFinalOf2] = {};

                        changed = true;
                        break outer;
                    }
                }
            }
        }

        // 2) keep a final warning iff none of the warnings in its group is marked for removal
        var finalWarnings = [];
        Object.keys(finalToIdxs).forEach(function(finalIdx) {
            var idxs = finalToIdxs[finalIdx];
            if (Object.keys(idxs).length > 0) {
                var finalWarning = warnings[finalIdx];
                var keep = true;
                // check if any of the warnings this final warning represents is marked for removal
                Object.keys(idxs).forEach(function(inGroupIdx) {
                    if (Object.keys(warnings[inGroupIdx].filterBecause).length > 0)
                        keep = false;
                });
                if (keep)
                    finalWarnings.push(finalWarning);
            }
        });
        return finalWarnings;
    }

    function TypeDiffEntry(expr, kinds) {
        this.expr = expr;
        this.kinds = kinds;
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
            var kind = getKind(node.name);
            result[kind] = true;
        });
        return result;
    }

    function getKind(type) {
        if (type === "undefined" || type === "null" || type === "object" || type === "function"
              || type === "string" || type === "number" || type === "boolean"
              || type.indexOf("global scope") === 0 || type.indexOf("native function") === 0)
            return type;
        else if (type.indexOf("object(") === 0)
            return "object";
        else if (type.indexOf("function(") === 0)
            return "function";
        else if (type.indexOf("frame(") === 0)
            return "frame";
        else if (type.indexOf("array(") === 0)
            return "array";
        util.assert(false, type);
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

})();