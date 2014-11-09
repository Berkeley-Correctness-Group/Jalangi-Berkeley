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

(function(sandbox) {
    function TrackHiddenClass() {
        var MIN_CACHE_HITS = 1;
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
        var warning_limit = 5;

        function annotateObjectWithCreationLocation(obj, iid, sobj) {
            if (sobj && !sobj.loc) {
                sobj.loc = iid;
            }
        }

        function getCreationLocation(obj, sobj) {
            if (sobj && sobj.loc) {
                return sobj.loc;
            }
            return -1;
        }

        // check if obj is an Array and if false
        // and if false, return obj's shadow object.
        // the purpose is to reduce the query of shadow
        // objects to obtain performance improvement
        function isArray_getShadow(obj) {
            var isNormalArray = Array.isArray(obj) || (obj && obj.constructor && (obj instanceof Uint8Array || obj instanceof Uint16Array ||
                obj instanceof Uint32Array || obj instanceof Uint8ClampedArray ||
                obj instanceof ArrayBuffer || obj instanceof Int8Array || obj instanceof Int16Array ||
                obj instanceof Int32Array || obj instanceof Float32Array || obj instanceof Float64Array));

            if (isNormalArray) {
                return {isArray: true};
            }

            var sobj = smemory.getShadowObject(obj);
            if (sobj) {
                if (sobj.isArgumentsObj) {
                    return {isArray: true}; // if is arguments object
                }
            }

            return {isArray: false, sobj: sobj};
        }

        function isString(obj) {
            if (obj && (obj instanceof String || typeof obj === 'string')) {
                return true;
            }

            return false;
        }

        function getMetaInfo(iid) {
            var ret;
            //if (!HOP(info, iid)) {
            if(!(iid in info)) {
                ret = info[iid] = {
                    hit: 0,
                    miss: 0,
                    lastKey: null,
                    keysToCount: {},
                    objectLocs: {}
                };
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
            if ((ret = hidden.id) !== undefined) {
                return ret;
            } else {
                ret = hidden.id = idToHiddenClass.length;
                idToHiddenClass.push(hidden);
                return ret;
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
            if (fld === '__proto__') {
                return fld + ":f" + getUniqueId(val);
            } else if (typeof val === 'function') {
                return fld + ":f" + getUniqueId(val);
            } else {
                return fld + ":n";
            }
        }

        var count = 0;

        function getNextNode(node, key) {
            if (HOP(node, key)) {
                return node[key];
            } else {
                count++;
                return node[key] = {
                    "parent": node,
                    "field": key
                };
            }
        }

        function getLayout(hidden) {
            var ret = "";
            while (hidden) {
                if (hidden.field !== undefined)
                    ret = hidden.field + "|" + ret;
                hidden = hidden.parent;
            }
            return ret;
        }

        var f_count = 0;
        function getHiddenClass(obj, sobj, noCache) {
            //var sobj = smemory.getShadowObject(obj);
            var ret, key, fld, node;

            if (sobj) {
                if (!noCache && (ret = sobj.hiddenClass)) {
                    return ret;
                } else {
                    node = root;
                    key = getKey(obj, "__proto__");
                    node = getNextNode(node, key);
                    for (fld in obj) {
                        if (HOP(obj, fld) && !hasGetterSetter(obj, fld)) {
                            f_count++;
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

        function setHiddenClass(obj, hiddenClass, sobj) {
            if (sobj) {
                sobj.hiddenClass = hiddenClass;
            }
        }

        function possibleHiddenClassReset(obj, fld, val, sobj) {
            var tmp;

            tmp = obj[fld];
            if (tmp !== val) {
                obj[fld] = val;
                getHiddenClass(obj, sobj, true); // true means create a new hidden class
                obj[fld] = tmp;
            }
        }

        function updateHiddenClass(obj, fld, val, obj_sobj) {
            if (!hasGetterSetter(obj, fld)) {
                var hiddenClass = getHiddenClass(obj, obj_sobj);
                fld = "" + fld;
                if (hiddenClass) {
                    if (HOP(obj, fld)) {
                        if (typeof val === 'function') {
                            possibleHiddenClassReset(obj, fld, val, obj_sobj);
                        } else if (typeof obj[fld] === 'function') {
                            possibleHiddenClassReset(obj, fld, val, obj_sobj);
                        }
                    } else if (fld === '__proto__') {
                        possibleHiddenClassReset(obj, fld, val, obj_sobj);
                    } else {
                        hiddenClass = getNextNode(hiddenClass, getKey(obj, fld));
                        setHiddenClass(obj, hiddenClass, obj_sobj);
                    }
                }
            }
        }

        this.literal = function(iid, val) {
            var typeof_val = typeof val;
            if(typeof_val === 'object' || typeof_val === 'function') {
                var sobj = smemory.getShadowObject(val);
                annotateObjectWithCreationLocation(val, iid, sobj);
            }
            return val;
        };

        this.invokeFun = function(iid, f, base, args, val, isConstructor) {
            if (isConstructor && f.name !== 'Array') {
                var sobj = smemory.getShadowObject(val);
                annotateObjectWithCreationLocation(val, iid, sobj);
            }
            return val;
        };

        
        this.getFieldPre = function(iid, base, offset) {
            var isStr = isString(base);
            if(isStr) return;
            var result = isArray_getShadow(base);
            if (!result.isArray) {
                //var sobj = smemory.getShadowObject(base);
                var sobj = result.sobj;
                var hidden = getHiddenClass(base, sobj);
                if (hidden) {
                    var meta = getMetaInfo(iid);
                    var id = getHiddenClassId(hidden);
                    var key = id + ":" + offset;
                    updateMetaInfo(meta, key, getCreationLocation(base, sobj));
                }
            }
        };

        this.putFieldPre = function(iid, base, offset, val) {
            var isStr = isString(base);
            if(isStr) return val;
            var result = isArray_getShadow(base);
            if (!result.isArray) {
                //var sobj = smemory.getShadowObject(base);
                var sobj = result.sobj;
                updateHiddenClass(base, offset, val, sobj);
            }
            return val;
        };
        
        this.read = function(iid, name, val, isGlobal) {
            if (name === 'arguments') {
                var shadow_obj = smemory.getShadowObject(val);
                shadow_obj.isArgumentsObj = true;
            }
            return val;
        };


        function getRank(meta) {
            var rank = meta.miss;
            var maxCount = -1;
            var secondMaxCount = -1;
            for (var hiddenKey in meta.keysToCount) {
                if (HOP(meta.keysToCount, hiddenKey)) {
                    var count = meta.keysToCount[hiddenKey];
                    if (maxCount < count) {
                        secondMaxCount = maxCount;
                        maxCount = count;
                    } else if (secondMaxCount < count) {
                        secondMaxCount = count;
                    }
                }
            }
            return rank + secondMaxCount;
        }

        this.endExecution = function() {
            console.log('\n\n');
            console.log("---------------------------");
            console.log("Created " + count + " hidden classes.");
            console.log('f_count: ' + f_count);
            
            console.log();
            var tmp = [];
            for (var iid in info) {
                if (HOP(info, iid)) {
                    var tmpRank = getRank(info[iid]);
                    tmp.push({
                        iid: iid,
                        count: info[iid].miss,
                        meta: info[iid],
                        rank: tmpRank
                    });
                }
            }
            sort.call(tmp, function(a, b) {
                return b.rank - a.rank;
            });
            var len = tmp.length;
            var num = 0;
            for (var i = 0; i < len && i < warning_limit; i++) {
                var x = tmp[i];
                if (x.count > MIN_CACHE_HITS) {
                    var meta = x.meta;
                    num++;
                    console.log("property access at " + iidToLocation(x.iid) + " has missed cache " + x.count + " time(s).");
                    for (var loc in meta.objectLocs) {
                        if (HOP(meta.objectLocs, loc)) {
                            console.log("  accessed property \"" + meta.lastKey.substring(meta.lastKey.indexOf(":") + 1) + "\" of object created at " + iidToLocation(loc) + " " + meta.objectLocs[loc] + " time(s) ");
                        }
                    }
                    var mergeDB = {};
                    for (var hiddenKey in meta.keysToCount) {
                        if (HOP(meta.keysToCount, hiddenKey)) {
                            var hiddenIdx = parseInt(hiddenKey.substring(0, hiddenKey.indexOf(":")));
                            var hidden = idToHiddenClass[hiddenIdx];
                            var layout = getLayout(hidden);
                            var fieldName = hiddenKey.substring(hiddenKey.indexOf(":") + 1, hiddenKey.length);
                            if (!mergeDB[layout]) {
                                mergeDB[layout] = "  layout [" + getLayout(hidden) + "]:";
                            }
                            mergeDB[layout] += '\n' + '\tput field: ' + fieldName + ' observed ' + meta.keysToCount[hiddenKey] + " time(s)";
                        }
                    }
                    for (var layout in mergeDB) {
                        if (HOP(mergeDB, layout)) {
                            console.log(mergeDB[layout]);
                        }
                    }
                }
            }
            console.log('[****]HiddenClass: ' + num);
        };

    }
    sandbox.analysis = new TrackHiddenClass();
})(J$);