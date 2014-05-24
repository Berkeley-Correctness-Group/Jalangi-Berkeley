/*
 * Copyright 2014 University of California, Berkeley.
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

// more accurate simulation of hidden class structure in V8

/**
 * Check Rule: Monomorphic use of operations is perferred over polymorphic operations
 * This checker detect polymorphic get field operation
 *
 * A polymorphic get field operation retrieve property values from objects with
 * different layouts. Which makes it hard for JIT-compiler to do inline caching.
 *
 * This analysis simulates hidden classes and detects if a source location tries to
 * retrieve properties from objects that can have different hidden classes.
 */

(function (sandbox) {
    function TrackHiddenClass() {
        var MIN_CACHE_HITS = 20;
        var iidToLocation = sandbox.iidToLocation;
        var smemory = sandbox.smemory;
        var Constants = sandbox.Constants;
        var id = 0;
        var HOP = Constants.HOP;
        var hasGetterSetter = Constants.hasGetterSetter;
        var sort = Array.prototype.sort;

        var info = {};

        var root = {};
        var idToHiddenClass = [];
        var warning_limit = 10;

        function annotateObjectWithCreationLocation(obj, iid) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj && !sobj.loc) {
                sobj.loc = iid;
            }
        }

        function getCreationLocation(obj) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj && sobj.loc) {
                return sobj.loc;
            }
            return -1;
        }

        function isArray (obj) {
            return Array.isArray(obj) || (obj && obj.constructor && (obj instanceof Uint8Array || obj instanceof Uint16Array ||
                obj instanceof Uint32Array || obj instanceof Uint8ClampedArray ||
                obj instanceof ArrayBuffer || obj instanceof Int8Array || obj instanceof Int16Array ||
                obj instanceof Int32Array || obj instanceof Float32Array || obj instanceof Float64Array));
        }

        function getMetaInfo(iid) {
            var ret;
            if (!HOP(info, iid)) {
                ret = info[iid] = {hit:0, miss:0, lastKey:null, keysToCount:{}, objectLocs:{}};
            } else {
                ret = info[iid];
            }
            return ret;
        }

        function updateMetaInfo(meta, key, loc) {
            if (meta.lastKey === key) {
                meta.hit++;
            } else {
                meta.miss++;
                meta.lastKey = key;
            }
            meta.keysToCount[key] = (meta.keysToCount[key] | 0) + 1;
            meta.objectLocs[loc] = (meta.objectLocs[loc] | 0) + 1;
        }

        function getHiddenClassId(hidden) {
            var ret;
            if ((ret = hidden.id)!==undefined) {
                return ret;
            } else {
                hidden.id = idToHiddenClass.length;
                idToHiddenClass.push(hidden);
                return hidden.id;
            }
        }

        function getUniqueId(obj) {
            var sobj = smemory.getShadowObject(obj);

            if (sobj) {
                if (sobj.id) {
                    return sobj.id;
                } else {
                    sobj.id = ++id;
                    return id;
                }
            }
            return 0;
        }

        function getKey(obj, fld) {
            var val = obj[fld];
            if (fld==='__proto__') {
                return fld+":f"+getUniqueId(val);
            } else if (typeof val === 'function') {
                return fld+":f"+getUniqueId(val);
            } else {
                return fld+":n";
            }

        }

        var count = 0;

        function getNextNode(node, key) {
            if (HOP(node, key)) {
                return node[key];
            } else {
                count++;
                return node[key] = {"parent":node, "field":key};
            }
        }

        function getLayout(hidden) {
            var ret = "";
            while(hidden) {
                if (hidden.field !== undefined)
                    ret = hidden.field + "|"+ret;
                hidden = hidden.parent;
            }
            return ret;
        }


        function getHiddenClass(obj, noCache) {
            var sobj = smemory.getShadowObject(obj);
            var ret, key, fld, node;


            if (sobj) {
                if (!noCache && (ret = sobj.hiddenClass)) {
                    return ret;
                }  else {
                    node = root;
                    key = getKey(obj, "__proto__");
                    node = getNextNode(node, key);
                    for (fld in obj) {
                        if (HOP(obj, fld) && !hasGetterSetter(obj, fld)) {
                            key = getKey(obj, fld);
                            node = getNextNode(node, key);
                        }
                    }
                    sobj.hiddenClass = node;
                    return node;
                }
            }
            return null;
        }

        function setHiddenClass(obj, hiddenClass) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj) {
                sobj.hiddenClass = hiddenClass;
            }
        }

        function possibleHiddenClassReset(obj, fld, val) {
            var tmp;

            tmp = obj[fld];
            if (tmp !== val) {
                obj[fld] = val;
                getHiddenClass(obj, true);
                obj[fld] = tmp;
            }
        }

        function updateHiddenClass(obj, fld, val) {
            if (!hasGetterSetter(obj, fld)) {
                var hiddenClass = getHiddenClass(obj);

                fld = "" + fld;
                if (hiddenClass) {
                    if (HOP(obj, fld)) {
                        if (typeof val === 'function') {
                            possibleHiddenClassReset(obj, fld, val);
                        } else if (typeof obj[fld] === 'function') {
                            possibleHiddenClassReset(obj, fld, val);
                        }
                    } else if (fld === '_proto__') {
                        possibleHiddenClassReset(obj, fld, val);
                    } else {
                        hiddenClass = getNextNode(hiddenClass, getKey(obj, fld));
                        setHiddenClass(obj, hiddenClass);
                    }
                }
            }
        }

        this.literal = function (iid, val) {
            annotateObjectWithCreationLocation(val, iid);
            return val;
        };

        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            if (isConstructor) {
                annotateObjectWithCreationLocation(val, iid);
            }
            return val;
        };

        this.getFieldPre = function (iid, base, offset) {
            if (!isArray(base)) {
                var hidden = getHiddenClass(base);
                if (hidden) {
                    var meta = getMetaInfo(iid);
                    var id = getHiddenClassId(hidden);
                    var key = id + ":" + offset;
                    updateMetaInfo(meta, key, getCreationLocation(base));
                }
            }
        };

        this.putFieldPre = function (iid, base, offset, val) {
            if (!isArray(base))
                updateHiddenClass(base, offset, val);
            return val;
        };

        this.endExecution = function () {
            console.log('\n\n');
            console.log("---------------------------");
            console.log("Created "+count+" hidden classes.");
            console.log();
            var tmp = [];
            for (var iid in info) {
                if (HOP(info, iid)) {
                    tmp.push({iid:iid, count:info[iid].miss, meta:info[iid]});
                }
            }
            sort.call(tmp, function(a,b) {
                return b.count - a.count;
            });
            var len = tmp.length;
            for (var i=0; i<len && i<warning_limit; i++) {
                var x = tmp[i];
                if (x.count > MIN_CACHE_HITS) {
                    var meta = x.meta;
                    console.log("property access at " + iidToLocation(x.iid) + " has missed cache " + x.count + " time(s).");
                    for (var loc in meta.objectLocs) {
                        if (HOP(meta.objectLocs, loc)) {
                            console.log("  accessed property \""+meta.lastKey.substring(meta.lastKey.indexOf(":")+1)+"\" of object created at "+iidToLocation(loc)+" "+meta.objectLocs[loc]+" time(s) ")
                        }
                    }
                    var mergeDB = {};
                    for (var hiddenKey in meta.keysToCount) {
                        if (HOP(meta.keysToCount, hiddenKey)) {
                            var hiddenIdx = parseInt(hiddenKey.substring(0, hiddenKey.indexOf(":")));
                            var hidden = idToHiddenClass[hiddenIdx];
                            var layout = getLayout(hidden);
                            var fieldName = hiddenKey.substring(hiddenKey.indexOf(":") + 1, hiddenKey.length);
                            if(!mergeDB[layout]) {
                                mergeDB[layout] = "  layout [" + getLayout(hidden) + "]:";
                            }
                            mergeDB[layout] += '\n' + '\tput field: ' + fieldName + ' observed ' + meta.keysToCount[hiddenKey] + " time(s)";
                        }
                    }
                    for(var layout in mergeDB) {
                        if (HOP(mergeDB, layout)) {
                            console.log(mergeDB[layout]);
                        }
                    }
                }
            }
        };

    }
    sandbox.analysis = new TrackHiddenClass();
})(J$);

