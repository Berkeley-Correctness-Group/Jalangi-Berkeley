(function() {

    var util = importModule("CommonUtil");
    var visualization = importModule("Visualization");
    var callGraph = importModule("CallGraph");

    function analyzeTypes(engineResults, iidToLocation, printWarnings, visualizeAllTypes, visualizeWarningTypes) {
        var tableAndRoots = equiv3(engineResults.typeNameToFieldTypes);

        var typeGraph = createTypeGraph(tableAndRoots[1], tableAndRoots[0], engineResults.typeNameToFieldTypes);

        // TODO analyze() and visualization should use typeGraph
        var typeWarnings = analyze(engineResults.typeNameToFieldTypes, tableAndRoots[0], iidToLocation);
        analyzeBeliefs(typeWarnings, engineResults.frameToBeliefs);
        typeWarnings = callGraph.filterWarnings(engineResults.callGraph, typeWarnings);
        typeWarnings = filterByBelief(typeWarnings);
        typeWarnings = filterNullRelated(typeWarnings, typeGraph, tableAndRoots[0]);

        if (visualizeAllTypes) {
            var allHighlightedIIDs = {};
            addHighlightedIIDs(allHighlightedIIDs, typeWarnings);
            visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], engineResults.typeNameToFieldTypes, engineResults.typeNames, iidToLocation, allHighlightedIIDs, false);
        }

        typeWarnings.forEach(function(w) {
            if (printWarnings) {
                console.log(w.toString());
            }
            if (visualizeWarningTypes) {
                visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], engineResults.typeNameToFieldTypes, engineResults.typeNames, iidToLocation, w.highlightedIIDs, true, "warning" + w.id + ".dot");
            }
        });
        return typeWarnings;
    }

    var warningCtr = 0;

    /**
     * @param {TypeDescription} typeDescription
     * @param {string} fieldName
     * @param {array of pairs (TypeDescription, array of string)} observedTypesAndLocations
     * @param {set of string} highlightedIIDs
     */
    function InconsistentTypeWarning(typeDescription, fieldName, observedTypesAndLocations, highlightedIIDs) {
        this.typeDescription = typeDescription;
        this.fieldName = fieldName;
        this.observedTypesAndLocations = observedTypesAndLocations;
        this.highlightedIIDs = highlightedIIDs;
        warningCtr++;
        this.id = warningCtr;
        this.removeByBelief = false;
    }

    InconsistentTypeWarning.prototype.toString = function() {
        var s = "Warning " + this.id + ": " + this.fieldName + " of " + this.typeDescription.toString() + " has multiple types:\n";
        this.observedTypesAndLocations.forEach(function(observedTypeAndLocations) {
            s += "    " + observedTypeAndLocations[0].toString() + "\n";
            observedTypeAndLocations[1].forEach(function(location) {
                s += "        found at " + location + "\n";
            });
        });
        if (this.typeDiff) {
            s += "\n    Type diff:\n" + this.typeDiff.toString() + "\n";
        }
        return s;
    };

    function UndefinedFieldWarning(typeDescription, locations, highlightedIIDs) {
        this.typeDescription = typeDescription;
        this.locations = locations;
        this.highlightedIIDs = highlightedIIDs;
        warningCtr++;
        this.id = warningCtr;
    }

    UndefinedFieldWarning.prototype.toString = function() {
        var s = "Warning" + this.id + ": undefined field found in " + this.typeDescription + ":\n";
        this.locations.forEach(function(location) {
            s += "        found at " + location + "\n";
        });
        return s;
    };

    /**
     * @param {string} kind
     * @param {string} location
     * @param {string} typeName
     */
    function TypeDescription(kind, location, typeName) {
        util.assert(typeof location === "string", location + " -- " + typeof location + " -- " + JSON.stringify(location));
        this.kind = kind;
        this.location = location;
        this.typeName = typeName;
    }

    TypeDescription.prototype.toString = function() {
        return this.kind + " originated at " + this.location;
    };

    function analyze(typeNameToFieldTypes, table, iidToLocation) {
        var warnings = [];
        var done = {};
        for (var typeOrFunctionName in typeNameToFieldTypes) {
            if (util.HOP(typeNameToFieldTypes, typeOrFunctionName)) {
                typeOrFunctionName = getRoot(table, typeOrFunctionName);
                if (!util.HOP(done, typeOrFunctionName)) {
                    done[typeOrFunctionName] = true;
                    var fieldMap = typeNameToFieldTypes[typeOrFunctionName];
                    for (var field in fieldMap) {
                        if (util.HOP(fieldMap, field)) {
                            if (field === "undefined") {
                                var typeDescription = toTypeDescription(typeOrFunctionName, iidToLocation);
                                var locations = toLocations(typeMap, iidToLocation);
                                var highlightedIIDs = {};
                                highlightedIIDs[typeOrFunctionName] = true;
                                var warning = new UndefinedFieldWarning(typeDescription, locations, highlightedIIDs);
                                warnings.push(warning);
                            }
                        }
                    }
                    for (var field in fieldMap) {
                        if (util.HOP(fieldMap, field)) {
                            var typeMap = fieldMap[field];
                            if (util.sizeOfMap(typeMap) > 1) {
                                lbl1: for (var type1 in typeMap) {
                                    if (util.HOP(typeMap, type1) && util.HOP(table, type1)) {
                                        for (var type2 in typeMap) {
                                            if (util.HOP(typeMap, type2) && util.HOP(table, type2)) {
                                                if (type1 < type2 && getRoot(table, type1) !== getRoot(table, type2)) {
                                                    if (!structuralSubTypes(table, typeNameToFieldTypes, type1, type2) &&
                                                          !potentiallyCompatibleFunctions(typeNameToFieldTypes, type1, type2)) {
                                                        // types are inconsistent: report warning
                                                        var typeDescription = toTypeDescription(typeOrFunctionName, iidToLocation);
                                                        var observedTypesAndLocations = [];
                                                        var observedRoots = {}; // report each root type at most once
                                                        for (var type3 in typeMap) {
                                                            var observedRoot = getRoot(table, type3);
                                                            if (!util.HOP(observedRoots, observedRoot)) {
                                                                observedRoots[observedRoot] = true;
                                                                var observedType = toTypeDescription(type3, iidToLocation);
                                                                var locations = toLocations(typeMap[type3], iidToLocation);
                                                                observedTypesAndLocations.push([observedType, locations]);
                                                            }
                                                        }
                                                        var highlightedIIDs = {};
                                                        highlightedIIDs[typeOrFunctionName] = true;
                                                        var warning = new InconsistentTypeWarning(typeDescription, field, observedTypesAndLocations, highlightedIIDs);
                                                        warnings.push(warning);
                                                        break lbl1;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return warnings;
    }

    /**
     * Returns true if both types are functions and if we don't know the
     * signature of at least one of them (i.e., they may have compatible 
     * signatures).
     * @param {} typeNameToFieldTypes
     * @param {string} type1
     * @param {string} type2
     * @returns {Boolean}
     */
    function potentiallyCompatibleFunctions(typeNameToFieldTypes, type1, type2) {
        if (type1.indexOf("function(") === 0 && type2.indexOf("function(") === 0) {
            var signature1 = typeNameToFieldTypes[type1];
            var signature2 = typeNameToFieldTypes[type2];
            if (signature1 === undefined || signature2 === undefined)
                return true;
        }
        return false;
    }

    /**
     * Check if two types are structural subtypes, that is, if all field types
     * of one type are exactly the same as the corresponding field types of the
     * other type.
     * @param {map: string->string} table
     * @param {} typeNameToFieldTypes
     * @param {string} type1
     * @param {string} type2
     * @returns {Boolean}
     */
    function structuralSubTypes(table, typeNameToFieldTypes, type1, type2) {
        return isStructuralSubtypeOrSameType(table, typeNameToFieldTypes, type1, type2) || isStructuralSubtypeOrSameType(table, typeNameToFieldTypes, type2, type1);
    }

    function isStructuralSubtypeOrSameType(table, typeNameToFieldTypes, superType, subType) {
        var superPropNameToTypes = typeNameToFieldTypes[superType];
        var subPropNameToTypes = typeNameToFieldTypes[subType];
        if (!superPropNameToTypes || !subPropNameToTypes)
            return false;  // at least one is a primitive type
        if (superPropNameToTypes && subPropNameToTypes && Object.keys(superPropNameToTypes).length > Object.keys(subPropNameToTypes).length)
            return false;
        for (var propName in superPropNameToTypes) {
            if (util.HOP(superPropNameToTypes, propName)) {
                if (!util.HOP(subPropNameToTypes, propName))
                    return false;  // missing property
                if (!haveSingleRoot(table, superPropNameToTypes[propName], subPropNameToTypes[propName]))
                    return false;  // same property name but inconsistent types
            }
        }
        return true;
    }

    function haveSingleRoot(table, types1, types2) {
        var theRoot;
        for (var t1 in types1) {
            if (util.HOP(types1, t1)) {
                var root = getRoot(table, t1);
                if (theRoot && root !== theRoot)
                    return false;
                theRoot = root;
            }
        }
        for (var t2 in types2) {
            if (util.HOP(types2, t2)) {
                var root = getRoot(table, t2);
                if (theRoot && root !== theRoot)
                    return false;
                theRoot = root;
            }
        }
        return true;
    }

    function getRoot(table, typeOrFunctionName) {
        var ret = table[typeOrFunctionName];
        while (ret !== typeOrFunctionName) {
            typeOrFunctionName = ret;
            ret = table[typeOrFunctionName];
        }
        return ret;
    }

    function addHighlightedIIDs(iids, warnings) {
        warnings.forEach(function(w) {
            Object.keys(w.highlightedIIDs).forEach(function(iid) {
                iids[iid] = true;
            });
        });
    }

    function equiv3(typeNameToFieldTypes) {
        var fieldNamesToTypes = createFieldNamesToTypes(typeNameToFieldTypes);
        var typeToRoot = initialTypeToRoot(fieldNamesToTypes);
        var changed = true;
        var type;
        while (changed) {
            changed = false;
            typeLoop: for (type in typeToRoot) {
                if (util.HOP(typeToRoot, type)) {
                    if (!areSameTypes(type, typeToRoot[type], typeNameToFieldTypes, {})) {
                        assignOtherRoot(type, typeToRoot, fieldNamesToTypes, typeNameToFieldTypes);
                        changed = true;
                        break typeLoop;
                    }
                }
            }

        }
        var tableAndRoots = toTableAndRoots(typeToRoot);
        typeToRoot['number'] = 'number';
        typeToRoot['boolean'] = 'boolean';
        typeToRoot['string'] = 'string';
        typeToRoot['undefined'] = 'undefined';
        typeToRoot['null'] = 'null';
        return tableAndRoots;
    }

    function initialTypeToRoot(fieldNamesToTypes) {
        var typeToRoot = {};
        for (var fieldNames in fieldNamesToTypes) {
            if (util.HOP(fieldNamesToTypes, fieldNames)) {
                var types = Object.keys(fieldNamesToTypes[fieldNames]);
                types.forEach(function(t) {
                    typeToRoot[t] = types[0];
                });
            }
        }
        return typeToRoot;
    }

    function getFieldNames(type, typeNameToFieldTypes) {
        var fieldToFieldTypes = typeNameToFieldTypes[type];
        var fieldNames = Object.keys(fieldToFieldTypes).sort().toString();
        return fieldNames;
    }

    function createFieldNamesToTypes(typeNameToFieldTypes) {
        var fieldNamesToTypes = {};
        for (var type in typeNameToFieldTypes) {
            if (util.HOP(typeNameToFieldTypes, type)) {
                var fieldNames = getFieldNames(type, typeNameToFieldTypes);
                var typesWithFieldNames = fieldNamesToTypes[fieldNames] || {};
                typesWithFieldNames[type] = true;
                fieldNamesToTypes[fieldNames] = typesWithFieldNames;
            }
        }
        return fieldNamesToTypes;
    }

    // structural comparison of two types
    function areSameTypes(t1, t2, typeNameToFieldTypes, visitedTypes) {
        if (t1 === t2)
            return true;
        if (visitedTypes[t1] === t2)
            return true;
        if (visitedTypes[t1] !== undefined)
            return false;
        var fieldToTypes1 = typeNameToFieldTypes[t1];
        var fieldToTypes2 = typeNameToFieldTypes[t2];
        if (fieldToTypes1 === undefined || fieldToTypes2 === undefined)
            return false;
        var fields1 = Object.keys(fieldToTypes1);
        var fields2 = Object.keys(fieldToTypes2);
        if (fields1.length !== fields2.length)
            return false;
        if (fields1.sort().toString() !== fields2.sort().toString())
            return false;

        visitedTypes[t1] = t2;
        for (var field1 in fieldToTypes1) {
            if (util.HOP(fieldToTypes1, field1)) {
                var types1 = fieldToTypes1[field1];
                var types2 = fieldToTypes2[field1];
                if (Object.keys(types1).length !== Object.keys(types2).length)
                    return false;
                for (var targetType1 in types1) {
                    if (util.HOP(types1, targetType1)) {
                        var hasEquivInType2 = false;
                        for (var targetType2 in types2) {
                            if (util.HOP(types2, targetType2)) {
                                if (areSameTypes(targetType1, targetType2, typeNameToFieldTypes, visitedTypes)) {
                                    hasEquivInType2 = true;
                                    break;
                                }
                            }
                        }
                        if (!hasEquivInType2)
                            return false;
                    }
                }
            }
        }
        return true;
    }

    function assignOtherRoot(type, typeToRoot, fieldNamesToTypes, typeNameToFieldTypes) {
        var oldRoot = typeToRoot[type];
        var candidateTypes = fieldNamesToTypes[getFieldNames(type, typeNameToFieldTypes)];
        delete candidateTypes[oldRoot];
        if (Object.keys(candidateTypes).length === 0) {
            typeToRoot[type] = type;
            return;
        } else {
            for (var candidateType in candidateTypes) {
                if (util.HOP(candidateTypes, candidateType)) {
                    if (areSameTypes(type, candidateType, typeNameToFieldTypes, {})) {
                        typeToRoot[type] = candidateType;
                        return;
                    }
                }
            }
        }
        typeToRoot[type] = type;
    }

    function toTableAndRoots(typeToRoot) {
        var roots = {};
        for (var t in typeToRoot) {
            if (util.HOP(typeToRoot, t)) {
                var r = typeToRoot[t];
                roots[r] = true;
            }
        }
        return [typeToRoot, roots];
    }

    function TypeNode(name) {
        this.name = name;
        this.fieldToTypeNodes = {}; // string --> array of TypeNode
    }

    TypeNode.prototype.addField = function(fieldName, targetTypeNode) {
        var types = [];
        if (util.HOP(this.fieldToTypeNodes, fieldName))
            types = this.fieldToTypeNodes[fieldName];
        var entryExists = types.some(function(t) {
            return t === targetTypeNode;
        });
        if (!entryExists) {
            types.push(targetTypeNode);
            this.fieldToTypeNodes[fieldName] = types;
        }
    };

    var PrimitiveTypeNodes = {
        UNDEFINED:new TypeNode("undefined"),
        NULL:new TypeNode("null"),
        NUMBER:new TypeNode("number"),
        BOOLEAN:new TypeNode("boolean"),
        STRING:new TypeNode("string")
    };

    function createTypeGraph(roots, typeToRoot, typeNameToFieldTypes) {
        var nodes = {};
        function getOrCreateNode(name) {
            var node = nodes[name];
            if (node)
                return node;
            node = new TypeNode(name);
            nodes[name] = node;
            return node;
        }

        for (var root in roots) {
            if (util.HOP(roots, root)) {
                var node = getOrCreateNode(root);
                var fieldTypes = typeNameToFieldTypes[root];
                for (var field in fieldTypes) {
                    if (util.HOP(fieldTypes, field)) {
                        var targetTypes = fieldTypes[field];
                        Object.keys(targetTypes).forEach(function(targetType) {
                            var targetRoot = typeToRoot[targetType];
                            if (targetRoot) { // e..g, objects created in native code don't have roots
                                var targetNode = getOrCreateNode(targetRoot);
                                node.addField(field, targetNode);
                            }
                        });
                    }
                }
            }
        }
        for (var primKey in PrimitiveTypeNodes) {
            if (util.HOP(PrimitiveTypeNodes, primKey)) {
                var primNode = PrimitiveTypeNodes[primKey];
                nodes[primNode.name] = primNode;
            }
        }
        return nodes;
    }

    function TypeDiffEntry(expr, kinds) {
        this.expr = expr;
        this.kinds = kinds;
    }
    
    TypeDiffEntry.prototype.toString = function() {
        return this.expr+" can be "+this.kinds.toString();
    };

    /**
     * @param {array of TypeNode} rawNodes
     * @param {string --> true} visited
     * @param {string} prefix
     * @param {string --> TypeDiffEntry} result
     */
    function typeDiff2(rawNodes, visited, prefix, result) {
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
                        typeDiff2(targetsOfField, visited, newPrefix, result);
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
            var typeNodes = node.fieldToTypeNodes[fieldName];
            if (typeNodes === undefined) {
                nameToNode[PrimitiveTypeNodes.UNDEFINED.name] = PrimitiveTypeNodes.UNDEFINED;
            } else {
                typeNodes.forEach(function(typeNode) {
                    nameToNode[typeNode.name] = typeNode;
                });
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

    function toTypeDescription(type, iidToLocation) {
        if (type.indexOf("(") > 0) {
            var type1 = type.substring(0, type.indexOf("("));
            var iid = type.substring(type.indexOf("(") + 1, type.indexOf(")"));
            if (iid === "null") {
                return new TypeDescription("null", "", "null");
            } else {
                return new TypeDescription(type1, iidToLocation(iid), type);
            }
        } else if (type.indexOf("native function") === 0) {
            return new TypeDescription("function", type, type);
        } else {
            return new TypeDescription(type, "", type);
        }
    }

    function toLocations(map, iidToLocation) {
        var result = [];
        for (var loc in map) {
            if (util.HOP(map, loc)) {
                var locStr = iidToLocation(loc);
                result.push(locStr);
            }
        }
        return result;
    }

    function filterNullRelated(warnings, typeGraph, typeToRoot) {
        return warnings.filter(function(w) {
            var observedTypes = w.observedTypesAndLocations.map(function(tl) {
                return tl[0].typeName;
            });
            var typeNodes = observedTypes.map(function(typeName) {
                var rootName = typeToRoot[typeName];
                return typeGraph[rootName];
            });
            var diffs = {};
            typeDiff2(typeNodes, {}, w.fieldName, diffs);

            var hasNonNullRelated = Object.keys(diffs).some(function(diffKey) {
                var diff = diffs[diffKey];
                return diff.kinds.indexOf("null") === -1;
            });
            if (hasNonNullRelated) {
                w.typeDiff = Object.keys(diffs).toString();
                return true;
            } else {
                return false;
            }
        });
    }

    /**
     * Marks warnings that can be removed due to "beliefs".
     * @param {type} typeWarnings
     * @param {type} frameToBeliefs
     * @returns {undefined}
     */
    function analyzeBeliefs(typeWarnings, frameToBeliefs) {
        typeWarnings.forEach(function(w) {
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
                        w.removeByBelief = true;
                    }
                }
            }
        });
    }

    function filterByBelief(typeWarnings) {
        return typeWarnings.filter(function(w) {
            return w.removeByBelief === false;
        });
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$TypeAnalysis = {};
        module = window.$TypeAnalysis;
    }

    function importModule(moduleName) {
        if (typeof exports !== "undefined") {
            return require('./' + moduleName + ".js");
        } else {
            return window['$' + moduleName];
        }
    }

    // exports
    module.analyzeTypes = analyzeTypes;
    module.getRoot = getRoot;
})();