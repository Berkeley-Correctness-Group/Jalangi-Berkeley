(function() {

    var util = importModule("CommonUtil");
    var visualization = importModule("Visualization");
    var callGraph = importModule("CallGraph");

    var maxTypesForTypeDiff = 5;
    var maxNodesInCanonicalRepr = 100;
    var maxWorkListForCanonical = 100;

    function analyzeTypes(engineResults, iidToLocation, printWarnings, visualizeAllTypes, visualizeWarningTypes) {
        var tableAndRoots = equiv3(engineResults.typeNameToFieldTypes);
        var typeWarnings = analyze(engineResults.typeNameToFieldTypes, tableAndRoots[0], iidToLocation);

        analyzeBeliefs(typeWarnings, engineResults.frameToBeliefs);
        typeWarnings = callGraph.filterWarnings(engineResults.callGraph, typeWarnings);
        typeWarnings = filterByBelief(typeWarnings);

        if (visualizeAllTypes) {
            var allHighlightedIIDs = {};
            addHighlightedIIDs(allHighlightedIIDs, typeWarnings);
            visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], engineResults.typeNameToFieldTypes, engineResults.typeNames, iidToLocation, allHighlightedIIDs, false);
        }

        typeWarnings.forEach(function(w) {
            if (w.observedTypesAndLocations.length <= maxTypesForTypeDiff) {
//                w.typeDiff = computeTypeDiff(w, engineResults.typeNameToFieldTypes);   // TODO infinite loop possible, see warning in box2d
            }
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
     * @param {} getFieldTypes
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
     * @param {} getFieldTypes
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

    function equiv2(typeNameToFieldTypes) {
        var table = {};
        var roots = {};
        for (var name in typeNameToFieldTypes) {
            if (util.HOP(typeNameToFieldTypes, name)) {
                table[name] = name;
                roots[name] = true;
            }
        }
        table['number'] = 'number';
        table['boolean'] = 'boolean';
        table['string'] = 'string';
        table['undefined'] = 'undefined';
        table['object(null)'] = 'object(null)';

        var changed = true, root1, root2;
        while (changed) {
            changed = false;
            for (var name1 in typeNameToFieldTypes) {
                if (util.HOP(typeNameToFieldTypes, name1)) {
                    var canonical1 = canonicalRepresentation(name1, typeNameToFieldTypes);
                    for (var name2 in typeNameToFieldTypes) {
                        if (util.HOP(typeNameToFieldTypes, name2) &&
                              name1 < name2 &&
                              (root1 = getRoot(table, name1)) !== (root2 = getRoot(table, name2)) &&
                              quickCompare(name1, name2, typeNameToFieldTypes)) {
                            var canonical2 = canonicalRepresentation(name2, typeNameToFieldTypes);
                            if (canonical1 === canonical2) {
                                // merged name1 and name2
                                if (root1 < root2) {
                                    table[root2] = root1;
                                    delete roots[root2];
                                } else {
                                    table[root1] = root2;
                                    delete roots[root1];
                                }
                                changed = true;
                            } else {
//                                console.log("-- not the same:\n    "+canonical1+" vs\n    "+canonical2+" -- "+typeof canonical2);
                            }
                        }
                    }
                }
            }
        }
//        console.log("==============");
//        console.log(JSON.stringify([table, roots], 0, 2));
        return [table, roots];
    }

    /**
     * Several quick comparisons to check whether two types certainly
     * have different canonical representations.
     * @param {type} type1
     * @param {type} type2
     * @param {type} typeNameToFieldTypes
     * @returns {Boolean}
     */
    function quickCompare(type1, type2, typeNameToFieldTypes) {
        var fieldTypes1 = typeNameToFieldTypes[type1];
        var fieldTypes2 = typeNameToFieldTypes[type2];
        if (fieldTypes1 && !fieldTypes2 || !fieldTypes1 && fieldTypes2)
            return false;
        var propNames1 = Object.keys(fieldTypes1);
        var propNames2 = Object.keys(fieldTypes2);
        if (propNames1.length !== propNames2.length)
            return false;
        var sortedPropNames1 = propNames1.sort();
        var sortedPropNames2 = propNames2.sort();
        var propNamesDiffer = false;
        sortedPropNames1.some(function(t, idx) {
            if (sortedPropNames2[idx] !== t) {
                propNamesDiffer = true;
                return true;
            }
        });
        if (propNamesDiffer)
            return false;
        return true;
    }

    function addHighlightedIIDs(iids, warnings) {
        warnings.forEach(function(w) {
            Object.keys(w.highlightedIIDs).forEach(function(iid) {
                iids[iid] = true;
            });
        });
    }

    function TypeDiff(commonExpressions, diffExpressions) {
        this.commonExpressions = commonExpressions;
        this.diffExpressions = diffExpressions;
    }

    TypeDiff.prototype.toString = function() {
        var s = "";
        var ctr = 0;
        for (var expr in this.diffExpressions) {
            if (util.HOP(this.diffExpressions, expr)) {
                ctr++;
                if (ctr < 5) {  // report only a few examples
                    s += "        " + expr + " has types " + Object.keys(this.diffExpressions[expr]).toString() + "\n";
                }
            }
        }
        if (s[s.length - 1] === '\n')
            s = s.slice(0, s.length - 1);
        return s;
    };

    function computeTypeDiff(warning, typeNameToFieldTypes) {
//        console.log("Computing type diff for " + warning.observedTypesAndLocations.length + " types");

        // for each observed type, compute all possible expressions and their types
        var observedTypeToExpressions = {}; // observed type (string) --> expression (string) --> type of expression (string)
        warning.observedTypesAndLocations.forEach(function(tl) {
            var observedType = tl[0].typeName;
            var expressions = allExpressions(observedType, typeNameToFieldTypes);
            observedTypeToExpressions[observedType] = expressions;
        });

        var commonExpressions = {}; // expression (string) --> type of expression (string)
        var diffExpressions = {};   // expression (string) --> set of type of expression (string -> true)
        var allObservedTypes = Object.keys(observedTypeToExpressions);
        util.assert(allObservedTypes.length > 1);
        // find expressions that are common to all observed types
        var someType = allObservedTypes[0];
        var expressionToType = observedTypeToExpressions[someType];
        Object.keys(expressionToType).forEach(function(expression) {
            // check if expression exists and has the same type for all other observed types
            var common = true;
            allObservedTypes.slice(1).some(function(otherType) {
                var otherExpressionToType = observedTypeToExpressions[otherType];
                if (!util.HOP(otherExpressionToType, expression) ||
                      otherExpressionToType[expression] !== expressionToType[expression]) {
                    common = false;
                    return true; // stop search
                }
            });
            if (common) {
                commonExpressions[expression] = expressionToType[expression];
            }
        });
        // find expressions that are not common to all observed types
        allObservedTypes.forEach(function(observedType) {
            var expressionToType = observedTypeToExpressions[observedType];
            for (var expression in expressionToType) {
                if (util.HOP(expressionToType, expression)) {
                    if (!util.HOP(commonExpressions, expression)) {
                        var allTypesOfExpression = diffExpressions[expression] || {};
                        allTypesOfExpression[expressionToType[expression]] = true;
                        diffExpressions[expression] = allTypesOfExpression;
                    }
                }
            }
        });

//        console.log(" .. done with type diff");
        return new TypeDiff(commonExpressions, diffExpressions);
    }

    /**
     * Compute the smallest set of all unique type expressions that start with "type.",
     * and the type they have.  
     * @param {string} type
     * @param {} typeNameToFieldTypes
     * @returns {string -> string}
     */
    function allExpressions(type, typeNameToFieldTypes) {
//        console.log("   allExpressions for type " + JSON.stringify(type));

        function WorkItem(prefix, visitedTypes, type) {
            this.prefix = prefix;
            this.visitedTypes = visitedTypes;
            this.type = type;
        }

        var result = {}; // expression (string) --> type (string)
        var worklist = []; // workitems
        var initiallyVisitedTypes = {};
        initiallyVisitedTypes[type] = true;
        worklist.push(new WorkItem("", initiallyVisitedTypes, type));
        while (worklist.length > 0) {
//            console.log("      worklist of length: " + worklist.length);

            var item = worklist.pop();
            var fieldTypes = typeNameToFieldTypes[item.type];
            if (fieldTypes === undefined || Object.keys(fieldTypes).length === 0) {
                // reached primitive type, or type without properties; stop exploring
                result[item.prefix] = item.type;
            } else {
                for (var prop in fieldTypes) {
                    if (util.HOP(fieldTypes, prop)) {
                        var newPrefix = item.prefix + "." + prop;
                        var propTypes = fieldTypes[prop];
                        for (var propType in propTypes) {
                            if (util.HOP(propTypes, propType)) {
                                if (util.HOP(item.visitedTypes, propType)) {
                                    // reached already visited type; stop exploring
                                    result[newPrefix] = propType;
                                } else {
                                    // reached not yet visited type; explore further
                                    var newVisitedTypes = util.shallowClone(item.visitedTypes);
                                    newVisitedTypes[propType] = true;
//                                    console.log("      --> pushing worklist item; visited types: " + Object.keys(newVisitedTypes) + " -- prefix: " + item.prefix + "." + prop + " -- next type: " + propType);
                                    worklist.push(new WorkItem(item.prefix + "." + prop, newVisitedTypes, propType));
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    function TypePath(canonicalRootNode, typeNameToIdOpt, lastIdOpt) {
        this.canonicalRootNode = canonicalRootNode;
        this.typeNameToId = typeNameToIdOpt || {};
        this.lastId = lastIdOpt || 0;
        this.nodeCtr = 1;
    }

    TypePath.prototype.clone = function() {
        var clonedRootNode = this.canonicalRootNode.clone();
        return new TypePath(clonedRootNode, util.shallowClone(this.typeNameToId), this.lastId);
    };

    TypePath.prototype.toCanonicalString = function() {
        return JSON.stringify(this.canonicalRootNode);
    };

    function CanonicalNode(id, kind, fieldsOpt) {
        this.id = id;
        this.kind = kind;
        this.fields = fieldsOpt || []; // array of pairs [string, x], where x is either CaninocalNode or a number (=node id)
    }

    CanonicalNode.prototype.clone = function() {
        var result = new CanonicalNode(this.id, this.kind, []);
        this.fields.forEach(function(pair) {
            if (typeof pair[1] === "number") {
                result.fields.push([pair[0], pair[1]]);
            } else {
                util.assert(typeof pair[1] === "object");
                result.fields.push([pair[0], pair[1].clone()]);
            }
        });
        return result;
    };

    function canonicalRepresentation(type, typeNameToFieldTypes) {
        function WorkItem(typePath, canonicalNode, type) {
            this.typePath = typePath;
            this.canonicalNode = canonicalNode;
            this.type = type;
        }
        var startNode = new CanonicalNode(0, getKind(type));
        var typePath = new TypePath(startNode);
        typePath.typeNameToId[type] = 0;
        var canonicalPaths = [typePath];
        var worklist = [];
        worklist.push(new WorkItem(typePath, startNode, type));
        while (worklist.length > 0) {
            // cut-off to deal with very large type graphs
            if (worklist.length > maxWorkListForCanonical) {
//                console.log("    canon done 1");
                return "very_complex_canonical_representation_" + Math.random().toString().slice(2);
            }
            var item = worklist[0];
            worklist = worklist.slice(1);   // FIFO
            if (item.typePath.nodeCtr > maxNodesInCanonicalRepr) { // cut-off to deal with types that reference many others
//                console.log("    canon done 2");
                return "very_complex_canonical_representation_" + Math.random().toString().slice(2);
            }
            var fieldNameToTypes = typeNameToFieldTypes[item.type];
            if (fieldNameToTypes === undefined || Object.keys(fieldNameToTypes).length === 0) {
                // primitive type or type without properties; stop exploring
            } else {
                var sortedFieldNames = Object.keys(fieldNameToTypes).sort();
                for (var fieldNameIdx = 0; fieldNameIdx < sortedFieldNames.length; fieldNameIdx++) {
                    var fieldName = sortedFieldNames[fieldNameIdx];
                    var fieldTypes = fieldNameToTypes[fieldName];
                    util.assert(Object.keys(fieldTypes).length > 0);
                    var fieldTypesCtr = 0;
                    if (Object.keys(fieldTypes).length > maxNodesInCanonicalRepr) {
//                        console.log("    canon done 3");
                        return "very_complex_canonical_representation_" + Math.random().toString().slice(2);
                    }
                    for (var fieldType in fieldTypes) {
                        if (util.HOP(fieldTypes, fieldType)) {
                            fieldTypesCtr++;
                            if (item.typePath.typeNameToId[fieldType] !== undefined) {
                                // already seen this type; don't recurse
                                item.canonicalNode.fields.push([fieldName, item.typePath.typeNameToId[fieldType]]);
                            } else {
                                // a not yet explored type; continue to explore
                                item.typePath.lastId++;
                                var newNode = new CanonicalNode(item.typePath.lastId, getKind(fieldType));
                                item.typePath.typeNameToId[fieldType] = item.typePath.lastId;
                                item.canonicalNode.fields.push([fieldName, newNode]);
                                item.typePath.nodeCtr++;

                                var typePath;
                                if (fieldTypesCtr === 1) {
                                    typePath = item.typePath;
                                } else {
                                    typePath = item.typePath.clone();
                                    canonicalPaths.push(typePath);
                                }
                                var newItem = new WorkItem(typePath, newNode, fieldType);
                                worklist.push(newItem);
                            }
                        }
                    }
                }
            }
        }

        // merge all canonical paths and return a single string
        var canonicalStrings = canonicalPaths.map(function(p) {
            return p.toCanonicalString();
        }).sort();
        var result = "";
        canonicalStrings.forEach(function(s) {
            if (result)
                result += " -- ";
            result += s;
        });
//        console.log("    canon done 4");
        return result;
    }


    //# start new equiv ###############################################################
    function equiv3(typeNameToFieldTypes) {
        var fieldNamesToTypes = createFieldNamesToTypes(typeNameToFieldTypes);
        var typeToRoot = initialTypeToRoot(fieldNamesToTypes);
        var changed = true;
        var type;
        while (changed) {
            console.log("Merging types, now have "+util.nbOfValues(typeToRoot)+" roots");
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
        typeToRoot['object(null)'] = 'object(null)';
        return tableAndRoots;
    }

    function initialTypeToRoot(fieldNamesToTypes) {
        var typeToRoot = {};
        for (var fieldNames in fieldNamesToTypes) {
            if (util.HOP(fieldNamesToTypes, fieldNames)) {
                var types = Object.keys(fieldNamesToTypes[fieldNames]);
                types.forEach(function (t) {
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
        return [ typeToRoot, roots ];
    }

    //# end new equiv ###############################################################

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

    // TODO replace by toLocations
    function getLocationsInfo(map, iidToLocation) {
        var str = "";
        for (var loc in map) {
            if (util.HOP(map, loc)) {
                str += "        found at " + iidToLocation(loc) + ",\n";
            }
        }
        return str;
    }

    function getTypeInfo(typeMap, iidToLocation) {
        var str = "";
        for (var type1 in typeMap) {
            if (util.HOP(typeMap, type1)) {
                str += getLocationsInfo(typeMap[type1], iidToLocation);
            }
        }
        return str;
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