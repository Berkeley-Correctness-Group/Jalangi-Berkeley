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

(function (sandbox) {
    function TrackHiddenClass() {
        var iidToLocation = sandbox.iidToLocation;
        var smemory = sandbox.smemory;
        var Constants = sandbox.Constants;
        var id = 0;
        var HOP = Constants.HOP;
        var hasGetterSetter = Constants.hasGetterSetter;
        var sort = Array.prototype.sort;
        var Utils = require(__dirname + '/utils/Utils.js');
        var warning_limit = 10;

        var info = {};

        var root = {};
        var idToHiddenClass = [];

        function getMetaInfo(iid) {
            var ret;
            if (!HOP(info, iid)) {
                ret = info[iid] = {hit:0, miss:0, lastKey:null, keysToCount:{}};
            } else {
                ret = info[iid];
            }
            return ret;
        }

        function updateMetaInfo(meta, key) {
            if (meta.lastKey === key) {
                meta.hit++;
            } else {
                meta.miss++;
                meta.lastKey = key;
            }
            meta.keysToCount[key] = (meta.keysToCount[key] | 0) + 1;
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

        function getNextNode(node, key) {
            if (HOP(node, key)) {
                return node[key];
            } else {
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
                            //if (Utils.isNormalNumber(fld)) {
                            //    continue;
                            //}
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
            //if (Utils.isNormalNumber(fld)) {
            //    return ;
            //}

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


        this.getFieldPre = function (iid, base, offset) {
            if(!Utils.isArr(base)) {
                var hidden = getHiddenClass(base);
                if (hidden) {
                    var meta = getMetaInfo(iid);
                    var id = getHiddenClassId(hidden);
                    var key = id + ":" + offset;
                    updateMetaInfo(meta, key);
                }
            }
        };

        this.putFieldPre = function (iid, base, offset, val) {
            if(!Utils.isArr(base))
                updateHiddenClass(base, offset, val);
            return val;
        };

        this.endExecution = function () {
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
                if (x.count > 50) {
                    var meta = x.meta;
                    console.log("Property access at " + iidToLocation(x.iid) + " has missed cache " + x.count + " time(s).");
                    for (var hiddenKey in meta.keysToCount) {
                        if (HOP(meta.keysToCount, hiddenKey)) {
                            var hiddenIdx = parseInt(hiddenKey.substring(0, hiddenKey.indexOf(":")));
                            var hidden = idToHiddenClass[hiddenIdx];
                            console.log("  layout [" + getLayout(hidden) + "] observed " + meta.keysToCount[hiddenKey] + " time(s)");
                        }
                    }
                }
            }
        };

    }
    sandbox.analysis = new TrackHiddenClass();
}(J$));

//todo: debug pdf.js
//todo: print less warnings
