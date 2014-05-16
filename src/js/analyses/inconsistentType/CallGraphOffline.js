(function() {
	function getFrameList(callgraph) {
		var frameList = {};
		Object.keys(callgraph.calls).forEach(function (key) {
			frameList[key] = true;
			Object.keys(callgraph.calls[key]).forEach(function(key) {
				frameList[key] = true;
			});
		});
		return frameList;
	}

	function flipMapping(mapping) {
		var reversed = {};
		Object.keys(mapping).forEach(function (key){
			reversed[mapping[key]] = key;
		});
		return reversed;
	}

	function compareWarn(disjointUnion, swarn, ewarn) {
		var swarn_obj = disjointUnion.fnwarns[swarn].observedTypesAndLocations;
		var ewarn_obj = disjointUnion.fnwarns[ewarn].observedTypesAndLocations;
		if(swarn_obj.length != ewarn_obj.length) {
			return false;
		}
		swarn_obj.forEach(function (sval) {
			match = false;
			ewarn_obj.forEach(function (eval) {
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
//		console.log(JSON.stringify(swarn) + " -> " + JSON.stringify(ewarn));
		var a = disjointFind(disjointUnion.map, swarn);
		var b = disjointFind(disjointUnion.map, ewarn);
		if (a !== b) {
			disjointUnion.map[a] = b;
	//		console.log(disjointUnion.map);
		}
	}

	function considerEdge(disjointUnion, snode, enode) {
		var swarns = disjointUnion.nameToWarn[snode];
//		console.log(disjointUnion.nameToWarn);
//		console.log(enode);
		var ewarns = disjointUnion.nameToWarn[enode];
		if(swarns !== undefined) {
			swarns.forEach(function(swarn) {
				if(ewarns !== undefined) {
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
		Object.keys(callgraph.frame_fn).forEach(function (fnname) {
			var frame_name = callgraph.frame_fn[fnname];
			considerEdge(disjointUnion, fnname, fnname + "_ret");
			considerEdge(disjointUnion, fnname, frame_name);
			considerEdge(disjointUnion, frame_name, fnname + "_ret");
			if (callgraph.calls[frame_name] !== undefined) {
				Object.keys(callgraph.calls[frame_name]).forEach(function (target_frame) {
					var target_fn = disjointUnion.frameToFn[target_frame];
					considerEdge(disjointUnion, frame_name, target_fn);
					considerEdge(disjointUnion, target_fn + "_ret", frame_name);
					considerEdge(disjointUnion, target_fn + "_ret", fnname + "_ret");
				});
			}
		});
	}

	function findMappableBugs(frameList, callgraph, warnings) {
		var fnwarns = [];
		var fnwarnslocs = [];
		var nameToWarn = {};
		var i = 0;
		warnings.forEach(function (warnlist) {
			var j = 0;
			warnlist.forEach(function (warn) {
				Object.keys(warn.highlightedIIDs).forEach(function (iid) {
					if (callgraph.frame_fn[iid] !== undefined || frameList[iid] !== undefined) {
						if (warn.fieldName == "return") {
							iid = iid + "_ret";
						}
						nameToWarn[iid] = nameToWarn[iid] || [];
						nameToWarn[iid].push(fnwarns.length);
						fnwarns.push(warn);
						fnwarnslocs.push([i, j]);
//console.log(warn);
					}
				});
				j += 1;
			});
			i += 1;
		});
		return {fnwarns:fnwarns, locs:fnwarnslocs, nameToWarn:nameToWarn,
		 frameList:frameList, callgraph:callgraph,
		 frameToFn:flipMapping(callgraph.frame_fn)};
	}

	function initDisjoint(disjointUnion) {
		var map = [];
		disjointUnion.fnwarns.forEach(function (key) {
			map.push(-1);
		});
		disjointUnion.map = map;
	}

	function groupWarnings(disjointUnion) {
		var map = disjointUnion.map;
		groups = {};
		for (var i = 0; i < map.length; i++) {
			if (map[i] >= 0) {
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
		return warnings.map(function (warnlist) {
			return warnlist.filter(function (warn) {
				var keep = true;
				Object.keys(warn.highlightedIIDs).forEach(function (iid) {
					if (callgraph.frame_fn[iid] !== undefined || frameList[iid] !== undefined) {
						if (map[i] >= 0) {
							keep = false;
						}
						i ++;
					}
				});
				return keep;
			});
		});
	}

	exports.addGraph = function (mapping, benchmark, callgraph, mergeLeftfn) {
		var graph = mapping[benchmark] || {};
		mergeLeftfn(graph, callgraph);
		mapping[benchmark] = graph;
	};

	exports.filterWarnings = function (mapping, benchmark, warnings) {
//		console.log(JSON.stringify(warnings));
//		return [[],[]];
		var callgraph = mapping[benchmark];
		var frameList = getFrameList(callgraph);

//		console.log(JSON.stringify(warnings));
//		console.log(JSON.stringify(mapping));
		

		var disjointUnion = findMappableBugs(frameList, callgraph, warnings);
//		console.log(compareWarn(disjointUnion, 0, 1));
//		console.log(disjointUnion);
		initDisjoint(disjointUnion);
//		console.log(disjointUnion);
		checkAllEdges(disjointUnion);
//		console.log(disjointUnion.map);
		groups = groupWarnings(disjointUnion);
//		console.log(groups);

		return removeDuplicates(disjointUnion, warnings, groups);

//		return [[],[]]; //[[warnings[0][0]], []];
	};
})();
