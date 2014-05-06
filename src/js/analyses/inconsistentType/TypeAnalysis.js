(function() {

    var util = importModule("CommonUtil");
    var visualization = importModule("Visualization");

    function analyzeTypes(typeNameToFieldTypes, functionToSignature, typeNames, functionNames, iidToLocation, printWarnings, visualizeAllTypes, visualizeWarningTypes) {
        var getFieldTypes = function(typeName) {
            if (typeName.indexOf("function(") === 0) {
                return functionToSignature[typeName];
            } else {
                return typeNameToFieldTypes[typeName];
            }
        };

        var tableAndRoots = equiv(typeNameToFieldTypes);
        var typeWarnings = analyze(typeNameToFieldTypes, tableAndRoots[0], iidToLocation, getFieldTypes);
        var functionWarnings = analyze(functionToSignature, tableAndRoots[0], iidToLocation, getFieldTypes);

        if (visualizeAllTypes) {
            var allHighlightedIIDs = {};
            addHighlightedIIDs(allHighlightedIIDs, typeWarnings);
            addHighlightedIIDs(allHighlightedIIDs, functionWarnings);
            visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], typeNameToFieldTypes, functionToSignature,
                  typeNames, functionNames, iidToLocation, allHighlightedIIDs, false);
        }

        typeWarnings.forEach(function(w) {
            if (printWarnings) {
                console.log(w.toString());
            }
            if (visualizeWarningTypes) {
                visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], typeNameToFieldTypes, functionToSignature,
                      typeNames, functionNames, iidToLocation, w.highlightedIIDs, true, "warning" + w.id + ".dot");
            }
        });
        functionWarnings.forEach(function(w) {
            if (printWarnings) {
                console.log(w.toString());
            }
            if (visualizeWarningTypes) {
                visualization.generateDOT(tableAndRoots[0], tableAndRoots[1], typeNameToFieldTypes, functionToSignature,
                      typeNames, functionNames, iidToLocation, w.highlightedIIDs, true, "warning" + w.id + ".dot");
            }
        });

        return [typeWarnings, functionWarnings];
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
    }

    InconsistentTypeWarning.prototype.toString = function() {
        var s = "Warning " + this.id + ": " + this.fieldName + " of " + this.typeDescription.toString() + " has multiple types:\n";
        this.observedTypesAndLocations.forEach(function(observedTypeAndLocations) {
            s += "    " + observedTypeAndLocations[0].toString() + "\n";
            observedTypeAndLocations[1].forEach(function(location) {
                s += "        found at " + location + "\n";
            });
        });
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
     */
    function TypeDescription(kind, location) {
        util.assert(typeof location === "string", location + " -- " + typeof location + " -- " + JSON.stringify(location));
        this.kind = kind;
        this.location = location;
    }

    TypeDescription.prototype.toString = function() {
        return this.kind + " originated at " + this.location;
    };

    function analyze(nameToFieldMap, table, iidToLocation, getFieldTypes) {
        var warnings = [];
        var done = {};
        for (var typeOrFunctionName in nameToFieldMap) {
            if (util.HOP(nameToFieldMap, typeOrFunctionName)) {
                typeOrFunctionName = getRoot(table, typeOrFunctionName);
                if (!util.HOP(done, typeOrFunctionName)) {
                    done[typeOrFunctionName] = true;
                    var fieldMap = nameToFieldMap[typeOrFunctionName];
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
                                                    if (!structuralSubTypes(table, getFieldTypes, type1, type2) &&
                                                          !potentiallyCompatibleFunctions(getFieldTypes, type1, type2)) {
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
     * @param {function} getFieldTypes
     * @param {string} type1
     * @param {string} type2
     * @returns {Boolean}
     */
    function potentiallyCompatibleFunctions(getFieldTypes, type1, type2) {
        if (type1.indexOf("function(") === 0 && type2.indexOf("function(") === 0) {
            var signature1 = getFieldTypes(type1);
            var signature2 = getFieldTypes(type2);
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
     * @param {function} getFieldTypes
     * @param {string} type1
     * @param {string} type2
     * @returns {Boolean}
     */    
    function structuralSubTypes(table, getFieldTypes, type1, type2) {
        return isStructuralSubtypeOrSameType(table, getFieldTypes, type1, type2) || isStructuralSubtypeOrSameType(table, getFieldTypes, type2, type1);
    }

    function isStructuralSubtypeOrSameType(table, getFieldTypes, superType, subType) {
        var superPropNameToTypes = getFieldTypes(superType);
        var subPropNameToTypes = getFieldTypes(subType);
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

    function equiv(typeName2FieldTypes) {
        var table = {};
        var roots = {};
        for (var name in typeName2FieldTypes) {
            if (util.HOP(typeName2FieldTypes, name)) {
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
            for (var name1 in roots) {
                if (util.HOP(roots, name1) && name1.indexOf("function") !== 0) {
                    loop2: for (var name2 in roots) {
                        if (util.HOP(roots, name2) &&
                              name1 < name2 &&
                              (root1 = getRoot(table, name1)) !== (root2 = getRoot(table, name2)) &&
                              name2.indexOf("function") !== 0) {
                            var fieldMap1 = typeName2FieldTypes[name1];
                            var fieldMap2 = typeName2FieldTypes[name2];
                            if (util.sizeOfMap(fieldMap1) !== util.sizeOfMap(fieldMap2)) {
                                continue loop2;
                            }
                            for (var field1 in fieldMap1) {
                                if (util.HOP(fieldMap1, field1) && !util.HOP(fieldMap2, field1)) {
                                    continue loop2;
                                }
                                var typeMap1 = fieldMap1[field1];
                                var typeMap2 = fieldMap2[field1];
                                if (util.sizeOfMap(typeMap1) !== util.sizeOfMap(typeMap2)) {
                                    continue loop2;
                                }
                                for (var type1 in typeMap1) {
                                    if (util.HOP(typeMap1, type1)) {
                                        var found = false;
                                        for (var type2 in typeMap2) {
                                            if (util.HOP(typeMap2, type2)) {
                                                if (type1 === type2) {
                                                    found = true;
                                                } else if (getRoot(table, type1) === getRoot(table, type2)) {
                                                    found = true;
                                                }
                                            }
                                        }
                                        if (!found) {
                                            continue loop2;
                                        }
                                    }
                                }
                            }
                            if (root1 < root2) {
                                table[root2] = root1;
                                delete roots[root2];
                            } else {
                                table[root1] = root2;
                                delete roots[root1];
                            }
                            changed = true;
                        }
                    }
                }
            }
        }
        return [table, roots];
    }

    function addHighlightedIIDs(iids, warnings) {
        warnings.forEach(function(w) {
            Object.keys(w.highlightedIIDs).forEach(function(iid) {
                iids[iid] = true;
            });
        });
    }

    function toTypeDescription(type, iidToLocation) {
        if (type.indexOf("(") > 0) {
            var type1 = type.substring(0, type.indexOf("("));
            var iid = type.substring(type.indexOf("(") + 1, type.indexOf(")"));
            if (iid === "null") {
                return new TypeDescription("null", "");
            } else {
                return new TypeDescription(type1, iidToLocation(iid));
            }
        } else {
            return new TypeDescription(type, "");
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