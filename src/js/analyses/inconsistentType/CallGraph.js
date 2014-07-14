// Author: Parker Schuh, Michael Pradel

(function() {
    var util = importModule("CommonUtil");

    var data = {calls:{}, frame_fn:{}};
    var callstack = [];
    var calls = data.calls;
    var frame_fn = data.frame_fn;
    var f_name;

    function getFrameList(callgraph) {
        var frameList = {};
        Object.keys(callgraph.calls).forEach(function(key) {
            frameList[key] = true;
            Object.keys(callgraph.calls[key]).forEach(function(key) {
                frameList[key] = true;
            });
        });
        return frameList;
    }

    function flipMapping(mapping) {
        var reversed = {};
        Object.keys(mapping).forEach(function(key) {
            reversed[mapping[key]] = key;
        });
        return reversed;
    }

    function compareWarn(disjointUnion, swarn, ewarn) {
        var swarn_obj = disjointUnion.fnwarns[swarn].observedTypesAndLocations;
        var ewarn_obj = disjointUnion.fnwarns[ewarn].observedTypesAndLocations;
        if (swarn_obj.length != ewarn_obj.length) {
            return false;
        }
        swarn_obj.forEach(function(sval) {
            match = false;
            ewarn_obj.forEach(function(eval) {
                if (sval[0].kind == eval[0].kind) {
                    if (sval[0].location == eval[0].location) {
                        match = true;
                    }
                }
            });
            if (!match) {
                return false;
            }
        });
        return true;
    }

    function leadsFromTo(disjointUnion, swarn, ewarn) {
        var swarn_obj = disjointUnion.fnwarns[swarn];
        var ewarn_obj = disjointUnion.fnwarns[ewarn];
        return compareWarn(disjointUnion, swarn, ewarn);
    }

    function disjointFind(map, key) {
        if (map[key] < 0) {
            return key;
        } else {
            var val = disjointFind(map, map[key]);
            map[key] = val;
            return val;
        }
    }

    function joinWarnFromTo(disjointUnion, swarn, ewarn) {
        var a = disjointFind(disjointUnion.map, swarn);
        var b = disjointFind(disjointUnion.map, ewarn);
        if (a !== b) {
            disjointUnion.map[a] = b;
        }
    }

    function considerEdge(disjointUnion, snode, enode) {
        var swarns = disjointUnion.nameToWarn[snode];
        var ewarns = disjointUnion.nameToWarn[enode];
        if (swarns !== undefined) {
            swarns.forEach(function(swarn) {
                if (ewarns !== undefined) {
                    ewarns.forEach(function(ewarn) {
                        if (leadsFromTo(disjointUnion, swarn, ewarn)) {
                            joinWarnFromTo(disjointUnion, swarn, ewarn);
                        }
                    });
                }
            });
        }
    }

    function checkAllEdges(disjointUnion) {
        var callgraph = disjointUnion.callgraph;
        Object.keys(callgraph.frame_fn).forEach(function(fnname) {
            var frame_name = callgraph.frame_fn[fnname];
            considerEdge(disjointUnion, fnname, fnname + "_ret");
            considerEdge(disjointUnion, fnname, frame_name);
            considerEdge(disjointUnion, frame_name, fnname + "_ret");
            if (callgraph.calls[frame_name] !== undefined) {
                Object.keys(callgraph.calls[frame_name]).forEach(function(target_frame) {
                    var target_fn = disjointUnion.frameToFn[target_frame];
                    considerEdge(disjointUnion, frame_name, target_fn);
// Added because function compression removes function arg and return warnings.
                    considerEdge(disjointUnion, frame_name, target_frame);
                    considerEdge(disjointUnion, target_fn + "_ret", frame_name);
                    considerEdge(disjointUnion, target_fn + "_ret", fnname + "_ret");
                });
            }
        });
    }

    function findMappableBugs(frameList, callgraph, warnings) {
        var fnwarns = [];
        var nameToWarn = {};
        warnings.forEach(function(warn) {
            var typeName = warn.typeDescription.typeName;
            if (callgraph.frame_fn[typeName] !== undefined || frameList[typeName] !== undefined) {
                if (warn.fieldName === "return") {
                    typeName = typeName + "_ret";
                }
                nameToWarn[typeName] = nameToWarn[typeName] || [];
                nameToWarn[typeName].push(fnwarns.length);
                fnwarns.push(warn);
            }
        });
        return {fnwarns:fnwarns, nameToWarn:nameToWarn,
            frameList:frameList, callgraph:callgraph,
            frameToFn:flipMapping(callgraph.frame_fn)};
    }

    function initDisjoint(disjointUnion) {
        var map = [];
        disjointUnion.fnwarns.forEach(function(key) {
            map.push(-1);
        });
        disjointUnion.map = map;
    }

    function groupWarnings(disjointUnion) {
        var map = disjointUnion.map;
        var groups = {};
        for (var i = 0; i < map.length; i++) {
            if (map[i] >= 0) {
                // Unfortunately this isn't the best leader. (need to transform into DAG and 
                // find sources and sinks to get true leader).
                var leader = disjointFind(map, i);
                groups[leader] = groups[leader] || [];
                groups[leader].push(i);
            }
        }
        return groups;
    }

    function removeDuplicates(disjointUnion, warnings, groups) {
        var i = 0;
        var callgraph = disjointUnion.callgraph;
        var frameList = disjointUnion.frameList;
        var map = disjointUnion.map;
        return warnings.filter(function(warn) {
            var keep = true;
            var typeName = warn.typeDescription.typeName;
            if (callgraph.frame_fn[typeName] !== undefined || frameList[typeName] !== undefined) {
                if (map[i] >= 0) {
                    keep = false;
                }
                i++;
            }
            return keep;
        });
    }

    var addGraph = function(mapping, benchmark, callgraph, mergeLeftfn) {
        var graph = mapping[benchmark] || {};
        mergeLeftfn(graph, callgraph);
        mapping[benchmark] = graph;
    };

    var markWarningsForMerging = function(callgraph, warnings) {
        var frameList = getFrameList(callgraph);

        var disjointUnion = findMappableBugs(frameList, callgraph, warnings);
        initDisjoint(disjointUnion);
        checkAllEdges(disjointUnion);
        var groups = groupWarnings(disjointUnion);
        markForMerging(groups, warnings);
//        return removeDuplicates(disjointUnion, warnings, groups);  // moved to FilterAndMerge
    };

    function markForMerging(groups, warnings) {
        for (var leaderIdx in groups) {
            if (util.HOP(groups, leaderIdx)) {
                var leaderWarning = warnings[leaderIdx];
                var otherIdxs = groups[leaderIdx];
                otherIdxs.forEach(function(otherIdx) {
                    var otherWarning = warnings[otherIdx];
                    otherWarning.addMergeWith(leaderWarning);
                    leaderWarning.addMergeWith(otherWarning);
                });
            }
        }
    }

    var fEnter = function(smemory) {
        var f = smemory.getCurrentFrame();
        var f_shad = smemory.getShadowObject(f).shadow;
        if (f_name !== undefined) {
            frame_fn[f_name] = f_shad;
        }
        if (callstack.length > 0) {
            var caller_shad = callstack[callstack.length - 1];
            if (data[caller_shad] === undefined) {
                calls[caller_shad] = {};
            }
            calls[caller_shad][f_shad] = true;
        }
        callstack.push(f_shad);
    };

    var fExit = function(smemory) {
        callstack.pop();
    };

    var prepareBind = function(smemory, f, f_sym) {
        f_name = f_sym;
    };

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$CallGraph = {};
        module = window.$CallGraph;
    }

    function importModule(moduleName) {
        if (typeof exports !== "undefined") {
            return require('./' + moduleName + ".js");
        } else {
            return window['$' + moduleName];
        }
    }

    module.addGraph = addGraph;
    module.markWarningsForMerging = markWarningsForMerging;
    module.fEnter = fEnter;
    module.fExit = fExit;
    module.prepareBind = prepareBind;
    module.data = data;

})();
