/*
 * Copyright 2013-2014 Samsung Information Systems America, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Koushik Sen, Michael Pradel

(function(sandbox) {

    function InconsistentTypeEngine() {
        var smemory = sandbox.smemory;
        var iidToLocation = sandbox.iidToLocation;
        var typeAnalysis = importModule("TypeAnalysis");
        var util = importModule("CommonUtil");

        var P_VALUE = 5.0;
        var online = true; // offline mode is only for in-browser analysis

        // type/function name could be object(iid) | array(iid) | function(iid) | object(null) | object | function | number | string | undefined | boolean
        var typeNameToFieldTypes = {}; // type name -> (field -> type name -> iid -> true)  --  for each type, gives the fields, their types, and where this field type has been observed
        var functionToSignature = {};  // function name -> ({"this", "return", "arg1", ...} -> type -> iid -> true)  --  for each function, gives the receiver, argument, and return types, and where these types have been observed
        var typeNames = {};
        var functionNames = {};

        function isArr(val) {
            return Object.prototype.toString.call(val) === '[object Array]';
        }

        var getSymbolic = this.getSymbolic = function(obj) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj) {
                return sobj.shadow;
            } else {
                return undefined;
            }
        };

        /**
         * @param {object} map
         * @param {string} key
         * @returns {object} 
         */
        function getAndInit(map, key) {
            if (!util.HOP(map, key))
                return map[key] = {};
            else
                return map[key];
        }

        /**
         * @param {string} name
         * @param {function | object} obj
         */
        function addFunctionOrTypeName(name, obj) {
            if (name.indexOf("function") === 0) {
                functionNames[name] = obj.name ? obj.name : "";
            } else {
                typeNames[name] = obj.constructor ? obj.constructor.name : "";
            }
        }

        /**
         * @param {object} base
         * @param {string} offset
         * @param {object} value
         * @param {number} updateLocation (IID)
         * @param {string} typeNameOptional
         */
        function updateType(base, offset, value, updateLocation, typeNameOptional) {
            var typeName, tval, type, s;
            if (!typeNameOptional) {
                typeName = getSymbolic(base);
            } else {
                typeName = typeNameOptional;
            }
            if (typeName) {
                addFunctionOrTypeName(typeName, base);
                tval = getAndInit(typeNameToFieldTypes, typeName);
                type = typeof value;
                s = getSymbolic(value);
                if (s) {
                    type = s;
                } else if (value === null) {
                    type = "object(null)";
                }
                if (typeName.indexOf("array") === 0) {
                    if (offset > 10) {
                        offset = 100000;
                    }
                }

                var tmap = getAndInit(tval, offset);
                var locations = getAndInit(tmap, type);
                locations[updateLocation] = true;
            }
        }

        /**
         * Attach shadow with type name to object.
         * @param {number} creationLocation
         * @param {object} obj
         * @returns {object} The given object
         */
        function annotateObject(creationLocation, obj) {
            var type, i, s, sobj;

            var sobj = smemory.getShadowObject(obj);

            if (sobj) {
                if (sobj.shadow === undefined) {
                    type = typeof obj;
                    if ((type === "object" || type === "function") && obj !== null && obj.name !== "eval") {
                        if (isArr(obj)) {
                            type = "array";
                        }
                        s = type + "(" + creationLocation + ")";
                        sobj.shadow = s;
                        addFunctionOrTypeName(s, obj);
                        getAndInit(typeNameToFieldTypes, s);
                        for (i in obj) {
                            if (util.HOP(obj, i)) {
                                updateType(obj, i, obj[i], creationLocation, s);
                            }
                        }
                    }
                }
            }
            return obj;
        }

        function setTypeInFunSignature(value, tval, offset, callLocation) {
            var type, typeName;
            type = typeof value;
            typeName = getSymbolic(value);
            if (typeName) {
                type = typeName;
            } else if (value === null) {
                type = "object(null)";
            }
            var tmap = getAndInit(tval, offset);
            var locations = getAndInit(tmap, type);
            locations[callLocation] = true;
        }

        /**
         * @param {function} f
         * @param {object} base
         * @param {array} args
         * @param {type} returnValue
         * @param {number} callLocation (IID)
         */
        function updateSignature(f, base, args, returnValue, callLocation) {
            var functionName, tval;
            functionName = getSymbolic(f);
            if (functionName) {
                addFunctionOrTypeName(functionName, f);
                tval = getAndInit(functionToSignature, functionName);
                setTypeInFunSignature(returnValue, tval, "return", callLocation);
                setTypeInFunSignature(base, tval, "this", callLocation);
                var len = args.length;
                for (var i = 0; i < len; ++i) {
                    setTypeInFunSignature(args[i], tval, "arg" + (i + 1), callLocation);
                }
            }
        }

        function logResults() {
            var results = {
                typeNameToFieldTypes:typeNameToFieldTypes,
                functionToSignature:functionToSignature,
                typeNames:typeNames,
                functionNames:functionNames
            };
            window.$jalangiFFLogResult(JSON.stringify(results), true);
        }

        this.literal = function(iid, val) {
            return annotateObject(iid, val);
        };

        this.putFieldPre = function(iid, base, offset, val) {
            updateType(base, offset, val, iid);
            return val;
        };

        this.invokeFun = function(iid, f, base, args, val, isConstructor) {
            var ret;
            if (isConstructor) {
                ret = annotateObject(iid, val);
            } else {
                ret = val;
            }
            updateSignature(f, base, args, ret, iid);
            return ret;
        };

        this.getField = function(iid, base, offset, val, isGlobal) {
            //var ret = annotateObject(iid, val);
            if (val !== undefined) {
                updateType(base, offset, val, iid);
            }
            //getConcrete(base)[getConcrete(offset)] = ret;
            return val;
        };

//        this.read = function(iid, name, val) {
//            return annotateObject(iid, val);
//        }

        
        function infoWithLocation(type) {
            if (type.indexOf("(") > 0) {
                var type1 = type.substring(0, type.indexOf("("));
                var iid = type.substring(type.indexOf("(") + 1, type.indexOf(")"));
                if (iid === "null") {
                    return " null";
                } else {
                    return "originated at " + iidToLocation(iid);
                }
            } else {
                return type;
            }
        }

        function isGoodType(map, table, oloc) {
            var done = {};
            oloc = getRoot(table, oloc);
            if (!util.HOP(done, oloc)) {
                done[oloc] = true;
                var fieldMap = map[oloc];
                for (var field in fieldMap) {
                    if (util.HOP(fieldMap, field)) {
                        if (field === "undefined") {
                            return false;
                        }
                    }
                }
                for (var field in fieldMap) {
                    if (util.HOP(fieldMap, field)) {
                        var typeMap = fieldMap[field];
                        if (sizeOfMap(typeMap) > 1) {
                            lbl1: for (var type1 in typeMap) {
                                if (util.HOP(typeMap, type1)) {
                                    for (var type2 in typeMap) {
                                        if (util.HOP(typeMap, type2)) {
                                            if (type1 < type2 && getRoot(table, type1) !== getRoot(table, type2)) {
                                                return false;
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
            return true;
        }



        function visitFieldsForDOT(table, types, node, nodeStr, edges) {
            var fieldMap = types[node], tmp;
            for (var field in fieldMap) {
                if (util.HOP(fieldMap, field)) {
                    tmp = escapeNode(field);
                    nodeStr = nodeStr + "|<" + tmp + ">" + tmp;
                }
                var typeMap = fieldMap[field];
                for (var type in typeMap) {
                    if (util.HOP(typeMap, type)) {
                        type = getRoot(table, type);
                        var tmp2 = escapeNode(type);
                        var edgeStr = "    " + escapeNode(node) + ":" + tmp + " -> " + tmp2 + ":" + tmp2;
                        edges[edgeStr] = true;
                    }
                }
            }
            return nodeStr;
        }

        function createLocationNodes(table, edges, srcNodes) {
            var locs = {};

            for (var node in table) {
                if (util.HOP(table, node) && node.indexOf("(") > 0 && node !== "object(null)") {
                    var loc, root = table[node];
                    loc = locs[root];
                    if (loc === undefined) {
                        loc = locs[root] = {};
                    }
                    loc[infoWithLocation(node)] = true;
                }
            }


            for (loc in locs) {
                if (util.HOP(locs, loc)) {
                    var lines = locs[loc];
                    var tmp = escapeNode(loc);
                    var nodeStr = "    " + tmp + "_loc [label = \"";
                    var first = true;
                    for (var line in lines) {
                        var tmp2 = escapeNode(line);
                        if (first) {
                            first = false;
                            nodeStr = nodeStr + tmp2;
                        } else {
                            nodeStr = nodeStr + "|" + tmp2;
                        }
                    }
                    nodeStr = nodeStr + "\"]";
                    srcNodes.push(nodeStr);
                    var edgeStr = "    " + tmp + ":" + tmp + " -> " + tmp + "_loc";
                    edges[edgeStr] = true;

                }
            }

        }

        function escapeNode(node) {
            return node.replace(/([\(\)\$])/g, "_").replace(/[Ee]dge/g, "Eedge").replace(/[Nn]ode/g, "Nnode");
        }

        function writeDOTFile(nodes, edges, srcNodes, badNodes) {
            var dot = 'digraph LikelyTypes {\n    rankdir = "LR"\n    node [fontname=Sans]\n\n';


            var i, len;

            dot += '    subgraph cluster_notes {\n';
            dot += '        node [shape = record, fillcolor=yellow, style=filled];\n';
            len = srcNodes.length;
            for (i = 0; i < len; i++) {
                dot = dot + "    " + srcNodes[i] + ';\n';
            }
            dot += '    }\n';


            dot += '    node [shape = Mrecord, fillcolor=lightpink, style=filled];\n';
            len = badNodes.length;
            for (i = 0; i < len; i++) {
                dot = dot + badNodes[i] + ';\n';
            }

            dot += '    node [shape = Mrecord, fillcolor=lightskyblue, style=filled];\n';
            len = nodes.length;
            for (i = 0; i < len; i++) {
                dot = dot + nodes[i] + ';\n';
            }

            for (i in edges) {
                if (util.HOP(edges, i)) {
                    dot = dot + i + ";\n";
                }
            }

            dot = dot + "}\n";
            require('fs').writeFileSync("jalangi_types.dot", dot);
            console.log("Generated " + process.cwd() + "/jalangi_types.dot.  Install graphviz and run \"dot -Tpng jalangi_types.dot -o jalangi_types.png; open jalangi_types.png\" to visualize the inferred types.");
            return dot;
        }

        function getName(key) {
            if (util.HOP(functionNames, key)) {
                return functionNames[key];
            } else if (util.HOP(typeNames, key)) {
                return typeNames[key];
            } else {
                return "";
            }
        }

        function generateDOT(table, roots, types, functions) {
            var nodes = [];
            var badNodes = [];
            var srcNodes = [];
            var edges = {};

            nodes.push("    number [label = \"<number>number\"]");
            nodes.push("    boolean [label = \"<boolean>boolean\"]");
            nodes.push("    string [label = \"<string>string\"]");
            nodes.push("    undefined [label = \"<undefined>undefined\"]");
            nodes.push("    " + escapeNode("object(null)") + " [label = \"<" + escapeNode("object(null)") + ">null\"]");
            for (var node in roots) {
                if (util.HOP(roots, node)) {
                    var tmp = escapeNode(node);
                    var nodeStr = "    " + tmp + " [label = \"<" + tmp + ">" + node.substring(0, node.indexOf("(")) + "\\ " + getName(node);

                    nodeStr = visitFieldsForDOT(table, functions, node, nodeStr, edges);
                    nodeStr = visitFieldsForDOT(table, types, node, nodeStr, edges);

                    nodeStr = nodeStr + "\"]";
                    if (isGoodType(types, table, node) && isGoodType(functions, table, node)) {
                        nodes.push(nodeStr);
                    } else {
                        badNodes.push(nodeStr);
                    }
                }
            }

            createLocationNodes(table, edges, srcNodes);
            return writeDOTFile(nodes, edges, srcNodes, badNodes);

        }

        this.endExecution = function() {
            if (online) {
                console.log("sandbox: "+JSON.stringify(sandbox)); // TODO RAD
                typeAnalysis.analyzeTypes(typeNameToFieldTypes, functionToSignature, sandbox.iids);
            } else {
                logResults();
            }
        };

        function importModule(moduleName) {
            if (sandbox.Constants.isBrowser) {
                return window['$' + moduleName];
            } else {
                return require('./' + moduleName + ".js");
            }
        }
    }

    if (sandbox.Constants.isBrowser) {
        sandbox.analysis = new InconsistentTypeEngine();

        window.addEventListener("beforeunload", function() {
            console.log("beforeunload --> logging results");
            sandbox.analysis.endExecution();
        }, false);
        window.addEventListener('keydown', function(e) {
            // keyboard shortcut is Alt-Shift-D
            if (e.altKey && e.shiftKey && e.keyCode === 68) {
                sandbox.analysis.endExecution();
            }
        });
    } else {
        module.exports = InconsistentTypeEngine;
    }

}(typeof J$ === 'undefined' ? (J$ = {}) : J$));
