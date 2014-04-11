(function() {

    var util = importModule("CommonUtil");

    function analyzeTypes(typeNameToFieldTypes, functionToSignature, iids) {
        console.log("analyzeTypes called with iids: "+iids); // TODO RAD
        var tableAndRoots = equiv(typeNameToFieldTypes);
        //console.log(
        //generateDOT(tableAndRoots[0], tableAndRoots[1], iidToFieldTypes, iidToSignature)
        //);
        analyze(typeNameToFieldTypes, tableAndRoots[0], iids);
        analyze(functionToSignature, tableAndRoots[0], iids);
        //console.log(JSON.stringify(iidToFieldTypes, null, '\t'));
    }

    function analyze(nameToFieldMap, table, iids) {
        var done = {};
        for (var typeOrFunctionName in nameToFieldMap) {
            if (util.HOP(nameToFieldMap, typeOrFunctionName)) {
                typeOrFunctionName = getRoot(table, typeOrFunctionName);
                if (!util.HOP(done, typeOrFunctionName)) {
                    done[typeOrFunctionName] = true;
                    var fieldMap = nameToFieldMap[typeOrFunctionName];
                    for (var field in fieldMap) {
                        if (util.HOP(fieldMap, field)) {
                            if (field === "undefined") { // TODO How to trigger this case? (MP)
                                console.log("Potential Bug: undefined field found in " + typeInfoWithLocation(typeOrFunctionName, iids) +
                                      ":\n" + getTypeInfo(typeMap, iids));
                            }
                        }
                    }
                    for (var field in fieldMap) {
                        if (util.HOP(fieldMap, field)) {
                            var typeMap = fieldMap[field];
                            if (util.sizeOfMap(typeMap) > 1) {
                                lbl1: for (var type1 in typeMap) {
                                    if (util.HOP(typeMap, type1)) {
                                        for (var type2 in typeMap) {
                                            if (util.HOP(typeMap, type2)) {
                                                if (type1 < type2 && getRoot(table, type1) !== getRoot(table, type2)) {
                                                    console.log("Warning: " + field + " of " + typeInfoWithLocation(typeOrFunctionName, iids) +
                                                          " has multiple types:");
                                                    for (var type3 in typeMap) {
                                                        console.log("    " + typeInfoWithLocation(type3, iids) + "\n" + getLocationsInfo(typeMap[type3], iids));
                                                    }
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

    function typeInfoWithLocation(type, iids) {
        if (type.indexOf("(") > 0) {
            var type1 = type.substring(0, type.indexOf("("));
            var iid = type.substring(type.indexOf("(") + 1, type.indexOf(")"));
            if (iid === "null") {
                return "null";
            } else {
                return type1 + " originated at " + iids[iid];
            }
        } else {
            return type;
        }
    }

    function getLocationsInfo(map, iids) {
        var str = "";
        for (var loc in map) {
            if (util.HOP(map, loc)) {
                str += "        found at " + iids[loc] + ",\n";
            }
        }
        return str;
    }

    function getTypeInfo(typeMap, iids) {
        var str = "";
        for (var type1 in typeMap) {
            if (util.HOP(typeMap, type1)) {
                str += getLocationsInfo(typeMap[type1], iids);
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
})();