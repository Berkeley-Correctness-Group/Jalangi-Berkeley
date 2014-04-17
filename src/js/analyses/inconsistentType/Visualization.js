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

// Author: Koushik Sen, Michael Pradel

(function() {

    // imports
    var util = importModule("CommonUtil");
    var typeAnalysis = importModule("TypeAnalysis");

    function generateDOT(table, roots, typeNameToFieldTypes, functionToSignature, typeNames, functionNames, iids) {
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
                var nodeStr = "    " + tmp + " [label = \"<" + tmp + ">" + node.substring(0, node.indexOf("(")) + "\\ " + getName(node, typeNames, functionNames);

                nodeStr = visitFieldsForDOT(table, functionToSignature, node, nodeStr, edges);
                nodeStr = visitFieldsForDOT(table, typeNameToFieldTypes, node, nodeStr, edges);

                nodeStr = nodeStr + "\"]";
                if (isGoodType(typeNameToFieldTypes, table, node) && isGoodType(functionToSignature, table, node)) {
                    nodes.push(nodeStr);
                } else {
                    badNodes.push(nodeStr);
                }
            }
        }

        createLocationNodes(table, edges, srcNodes, iids);
        return writeDOTFile(nodes, edges, srcNodes, badNodes);
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
                    type = typeAnalysis.getRoot(table, type);
                    var tmp2 = escapeNode(type);
                    var edgeStr = "    " + escapeNode(node) + ":" + tmp + " -> " + tmp2 + ":" + tmp2;
                    edges[edgeStr] = true;
                }
            }
        }
        return nodeStr;
    }

    function escapeNode(node) {
        return node.replace(/([\(\)\$])/g, "_").replace(/[Ee]dge/g, "Eedge").replace(/[Nn]ode/g, "Nnode");
    }

    function getName(key, typeNames, functionNames) {
        if (util.HOP(functionNames, key)) {
            return functionNames[key];
        } else if (util.HOP(typeNames, key)) {
            return typeNames[key];
        } else {
            return "";
        }
    }

    function createLocationNodes(table, edges, srcNodes, iids) {
        var locs = {};

        for (var node in table) {
            if (util.HOP(table, node) && node.indexOf("(") > 0 && node !== "object(null)") {
                var loc, root = table[node];
                loc = locs[root];
                if (loc === undefined) {
                    loc = locs[root] = {};
                }
                loc[infoWithLocation(node, iids)] = true;
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

    function isGoodType(map, table, oloc) {
        var done = {};
        oloc = typeAnalysis.getRoot(table, oloc);
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
                    if (util.sizeOfMap(typeMap) > 1) {
                        lbl1: for (var type1 in typeMap) {
                            if (util.HOP(typeMap, type1)) {
                                for (var type2 in typeMap) {
                                    if (util.HOP(typeMap, type2)) {
                                        if (type1 < type2 && typeAnalysis.getRoot(table, type1) !== typeAnalysis.getRoot(table, type2)) {
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

    function infoWithLocation(type, iids) {
        if (type.indexOf("(") > 0) {
            var type1 = type.substring(0, type.indexOf("("));
            var iid = type.substring(type.indexOf("(") + 1, type.indexOf(")"));
            if (iid === "null") {
                return " null";
            } else {
                return "originated at " + iids[iid].toString();
            }
        } else {
            return type;
        }
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
    module.generateDOT = generateDOT;

})();