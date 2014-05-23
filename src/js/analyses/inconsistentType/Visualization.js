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

    function generateDOT(table, roots, typeNameToFieldTypes, typeNames, iidToLocation, highlightedIIDs, onlyHighlighted, fileNameOpt) {
        var nodes = [];
        var badNodes = [];
        var locationNodes = [];

        nodes.push("    number [label = \"<number>number\"]");
        nodes.push("    boolean [label = \"<boolean>boolean\"]");
        nodes.push("    string [label = \"<string>string\"]");
        nodes.push("    undefined [label = \"<undefined>undefined\"]");
        nodes.push("    " + escapeNode("object(null)") + " [label = \"<" + escapeNode("object(null)") + ">null\"]");

        var nodeToNodeStr = {};
        var nodeToEdges = {}; // string -> string -> true
        var reachableFromHighlighted = {};
        var reachablesToCompleteOpt;
        var reachablesChanged = true;
        Object.keys(highlightedIIDs).forEach(function (iid) {
            reachableFromHighlighted[iid] = true;
        });
        while (reachablesChanged) {
            var oldNbReachables = Object.keys(reachableFromHighlighted).length;
            for (var node in roots) {
                if (util.HOP(roots, node)) {
                    reachablesToCompleteOpt = undefined;
                    if (util.HOP(reachableFromHighlighted, node)) {
                        reachableFromHighlighted[node] = true;
                        reachablesToCompleteOpt = reachableFromHighlighted;
                    }

                    var tmp = escapeNode(node);
                    var edges = {};
                    var nodeStr = "    " + tmp + " [label = \"<" + tmp + ">" + node.substring(0, node.indexOf("(")) + "\\ " + getName(node, typeNames);
                    nodeStr = visitFieldsForDOT(table, typeNameToFieldTypes, node, nodeStr, edges, reachablesToCompleteOpt);
                    nodeStr = nodeStr + "\"]";
                    nodeToNodeStr[node] = nodeStr;
                    nodeToEdges[node] = edges;
                }
            }
            reachablesChanged = oldNbReachables < Object.keys(reachableFromHighlighted).length;
        }

        var allEdges = {};
        for (var node in roots) {
            if (!onlyHighlighted || reachableFromHighlighted[node]) {
                if (util.HOP(highlightedIIDs, node)) {
                    badNodes.push(nodeToNodeStr[node]);
                } else {
                    nodes.push(nodeToNodeStr[node]);
                }
                Object.keys(nodeToEdges[node]).forEach(function(edge) {
                    allEdges[edge] = true;
                });
            }
        }
        createLocationNodes(table, allEdges, locationNodes, iidToLocation, onlyHighlighted ? reachableFromHighlighted : undefined);
        var fileName = fileNameOpt ? fileNameOpt : "jalangi_types.dot";
        return writeDOTFile(fileName, nodes, allEdges, locationNodes, badNodes);
    }

    function visitFieldsForDOT(table, types, node, nodeStr, edges, reachablesToCompleteOpt) {
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

                    if (reachablesToCompleteOpt) {
                        reachablesToCompleteOpt[type] = true;
                    }
                }
            }
        }
        return nodeStr;
    }

    function escapeNode(node) {
        return node.replace(/([\(\)\$])/g, "_").replace(/[Ee]dge/g, "Eedge").replace(/[Nn]ode/g, "Nnode");
    }

    function getName(key, typeNames) {
        return typeNames[key] || "";
    }

    function createLocationNodes(table, edges, locationNodes, iidToLocation, iidsToConsiderOpt) {
        var locs = {};

        for (var node in table) {
            if (util.HOP(table, node) && node.indexOf("(") > 0 && node !== "object(null)") {
                if (!iidsToConsiderOpt || iidsToConsiderOpt[node]) {
                    var loc, root = table[node];
                    loc = locs[root];
                    if (loc === undefined) {
                        loc = locs[root] = {};
                    }
                    loc[infoWithLocation(node, iidToLocation)] = true;
                }
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
                locationNodes.push(nodeStr);
                var edgeStr = "    " + tmp + ":" + tmp + " -> " + tmp + "_loc";
                edges[edgeStr] = true;
            }
        }
    }

    function writeDOTFile(fileName, nodes, edges, locationNodes, badNodes) {
        var dot = 'digraph LikelyTypes {\n    rankdir = "LR"\n    node [fontname=Sans]\n\n';

        var i, len;

        dot += '    subgraph cluster_notes {\n';
        dot += '        node [shape = record, fillcolor=yellow, style=filled];\n';
        len = locationNodes.length;
        for (i = 0; i < len; i++) {
            dot = dot + "    " + locationNodes[i] + ';\n';
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
        require('fs').writeFileSync(fileName, dot);
//        console.log("Generated " + process.cwd() + "/" + fileName + ".  Install graphviz and run \"dot -Tpng " + fileName + ".dot -o jalangi_types.png; open jalangi_types.png\" to visualize the inferred types.");
        return dot;
    }

    function infoWithLocation(type, iidToLocation) {
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

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$Visualization = {};
        module = window.$Visualization;
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