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

// Author: Liang Gong


((function (sandbox) {
    function OldHiddenClassSimulation() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;
        var smemory = sandbox.smemory;

        var RuntimeDB = require(__dirname + '/utils/RuntimeDB.js');
        var db = new RuntimeDB();
        var Utils = require(__dirname + '/utils/Utils.js');

        var warning_limit = 30;
        var cache_sig = true;

        // ---- JIT library functions start ----

        var total_get_sig_cnt = 0;
        function getObjSig(obj) {
            total_get_sig_cnt++;
            if (!cache_sig) {
                return generateObjSig(obj);
            }
            // if signature exists return it
            var shadow_obj = smemory.getShadowObject(obj);
            if (shadow_obj && shadow_obj.sig) {
                return shadow_obj.sig
            }

            // generate and record signature
            var sig = generateObjSig(obj);

            if (shadow_obj) {
                shadow_obj.sig = sig;
            }
            return sig;
        }

        function updateObjSig(obj) {
            if (!cache_sig) {
                return;
            }

            var shadow_obj = smemory.getShadowObject(obj);
            if (shadow_obj) {
                var sig = generateObjSig(obj);
                shadow_obj.sig = sig
            }
        }

        var totalSigCnt = 0;
        function generateObjSig(obj) {
            totalSigCnt++;
            //return '1';
            var sig = {};
            var obj_layout = '';
            var cnt = 0;
            try {
                if (Utils.isArr(obj)) {
                    obj_layout += 'no_sig_for_array|';
                } else if ((typeof obj === 'object' || typeof obj === 'function') && obj !== null) {

                    for (var prop in obj) {
                        cnt++;
                        if (HOP(obj, prop)) {
                            if (!Utils.isNormalNumber(prop)) { // if prop is number e.g., '0', '1' etc. then do not add it into the prop
                                obj_layout += prop + '|';
                            }
                        }
                    }
                }

                sig = {'obj_layout': obj_layout, 'pto': 'empty', 'con': 'empty'};
                sig.pto = obj.__proto__;
                sig.con = obj.constructor;

                // record object inforamtion that corresponds to each signature (hidden class)
                /* var shadow_obj = */
                smemory.getShadowObject(obj); // create a shadow object for obj
                sig.sterm_obj = obj;
            } catch (e) {
                sig = 'exception when generating signature';
            }
            return sig;
        }

        function isEqualObjSig(sig1, sig2) {
            if (sig1.obj_layout === sig2.obj_layout && sig1.pto === sig2.pto && sig1.con === sig2.con) {
                return true;
            } else {
                return false;
            }
        }

        function dumpSig(sig) {
            var str = ''
            for (var prop in sig) {
                var name = prop;
                var value = sig[prop]
                if (prop === 'pto') {
                    name = 'prototype';
                    value = JSON.stringify(value);
                } else if (prop === 'obj_layout') {
                    name = 'layout';
                    if (value[value.length - 1] === '|') {
                        value = value.substring(0, value.length - 1);
                    }
                }
                if (prop === 'con') {
                    continue;
                }
                str += '[' + name + ']: [ ' + value + ' ] | ';
            }
            return str;
        }

        function objSigToString(sig) {
            var str = '';
            try {
                var sterm_obj = sig.sterm_obj;
                sig.sterm_obj = 'hide';
                str += dumpSig(sig);
                sig.sterm_obj = sterm_obj;
                if (sig.con && sig.con.name) {
                    str = str + "constructor: " + sig.con.name;
                }

                if (sig.pto && sig.pto.constructor) {
                    str = str + " | proto constructor: " + sig.pto.constructor.name;
                }
            } catch (e) {
                console.log(e);
                str = sig.obj_layout + ' | constructor or prototype cannot be stringified';
            }
            return str;
        }

        var regex_match = /id:[ ]([^ ]*)[ ]iid:[ ]([^ \)]*)/;
        function printPolymorphicInfo(subindexName) {
            var num = 0;
            // first sort the results
            var jitArr = [];
            var jitResult = null;
            if (subindexName) {
                jitResult = db.getByIndexArr(['JIT-checker', 'polystmt', subindexName]);
                //console.log(JSON.stringify(jitResult));
            } else {
                jitResult = db.getByIndexArr(['JIT-checker', 'polystmt']);
            }
            for (var prop in jitResult) {
                if (HOP(jitResult, prop)) {
                    var query_sig = jitResult[prop];
                    if (query_sig && query_sig.length > 1) {
                        jitArr.push({'sigList': query_sig, 'iid': Utils.PARSEINT(prop)});
                        num++;
                    }
                }
            }

            // extract the second most frequently used signature count
            jitArr.sort(function compare(a, b) {
                var mostFreq = 0;
                var secMostFreq = 0;
                var curCnt = 0;
                for (var i = 0; i < a.sigList.length; i++) {
                    curCnt = a.sigList[i].count;
                    if (mostFreq < curCnt) {
                        secMostFreq = mostFreq;
                        mostFreq = curCnt;
                    } else if (secMostFreq < curCnt) {
                        secMostFreq = curCnt;
                    }
                }

                while (mostFreq >= 1) {
                    mostFreq /= 10.0;
                }

                var weightA = a.sigList.classChangeCnt + secMostFreq + mostFreq;

                mostFreq = 0;
                secMostFreq = 0;
                for (var i = 0; i < b.sigList.length; i++) {
                    curCnt = b.sigList[i].count;
                    if (mostFreq < curCnt) {
                        secMostFreq = mostFreq;
                        mostFreq = curCnt;
                    } else if (secMostFreq < curCnt) {
                        secMostFreq = curCnt;
                    }
                }

                while (mostFreq >= 1) {
                    mostFreq /= 10.0;
                }

                var weightB = b.sigList.classChangeCnt + secMostFreq + mostFreq;

                // sort in descending order
                return weightB - weightA;
            });
            try {
                for (var i = 0; i < jitArr.length && i < warning_limit; i++) {
                    var query_sig = jitArr[i].sigList;
                    if (query_sig && query_sig.length > 1) {
                        console.log('------');
                        console.log(' * [location: ' + iidToLocation(jitArr[i].iid) + '] <- No. layouts: ' + query_sig.length);
                        console.log('\thidden class switching rate: ' + query_sig.classChangeCnt / query_sig.totalCnt + '(' + query_sig.classChangeCnt + '/' + query_sig.totalCnt + ')');
                        for (var j = 0; j < query_sig.length; j++) {
                            console.log('count: ' + query_sig[j].count + ' -> Object Info:' + objSigToString(query_sig[j].sig));
                            var num_obj = 0;
                            var num_create_location = 0;
                            var set = {};
                            var locations = {};
                            instance_loop:
                                for (var objId in query_sig[j].instances) {
                                    if (HOP(query_sig[j].instances, objId)) {
                                        //console.log('\tobjId: ' + objId + '\t|\tcount: ' + query_sig[j].instances[objId]);
                                        if (objId.indexOf('unknown') >= 0) {
                                            continue instance_loop;
                                        }
                                        var result = regex_match.exec(objId);
                                        var id = result[1];
                                        var iid = result[2];
                                        if (!set[id]) {
                                            set[id] = 1;
                                            num_obj++;
                                        }
                                        if (locations[iid]) {
                                            locations[iid] += query_sig[j].instances[objId];
                                        } else {
                                            locations[iid] = query_sig[j].instances[objId];
                                        }
                                    }
                                }
                            console.log('\tTotal distinct obj: ' + num_obj); //+ '\r\n\t' + 'Obj create locations & counts: ' + JSON.stringify(locations);
                            for (var iid in locations) {
                                if (HOP(locations, iid)) {
                                    console.log('\toccurrance: ' + locations[iid] + '\t location: ' + iidToLocation(iid));
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(e);
                console.log(e.stack);
            }

            console.log('...');
            console.log('Number of polymorphic statements spotted: ' + num);

        }

        function checkIfObjectIsPolymorphic(base, iid, subindexName) {
            if (Utils.isArr(base)) {
                return;
            }
            var sig = getObjSig(base);
            var sterm_objId;
            if (sig.sterm_obj) {
                var shadow_obj = smemory.getShadowObject(sig.sterm_obj);
                if (shadow_obj) {
                    sterm_objId = shadow_obj.objId;
                }
            }
            if (!sterm_objId) {
                sterm_objId = 'unknown(external)';
            }
            var query_sig = null;
            if (subindexName) {
                query_sig = db.getByIndexArr(['JIT-checker', 'polystmt', subindexName, iid]);
            } else {
                query_sig = db.getByIndexArr(['JIT-checker', 'polystmt', iid]);
            }
            if (typeof query_sig === 'undefined') {
                // add object instance information associated
                // with the hidden class to the database
                var info_to_store = [
                    {'count': 1, 'sig': sig}
                ];
                info_to_store[0].instances = {};
                info_to_store[0].instances[sterm_objId] = 1;
                info_to_store.lastHiddenClass = sig;
                info_to_store.classChangeCnt = 0;
                info_to_store.totalCnt = 1;
                if (subindexName) {
                    db.setByIndexArr(['JIT-checker', 'polystmt', subindexName, iid], info_to_store);
                } else {
                    db.setByIndexArr(['JIT-checker', 'polystmt', iid], info_to_store);
                }
            } else {
                outter: {
                    for (var i = 0; i < query_sig.length; i++) {
                        if (isEqualObjSig(query_sig[i].sig, sig)) {
                            query_sig[i].count++;

                            // record object instance information associated
                            // with each signature (hidden class)
                            if (query_sig[i].instances) {
                                if (query_sig[i].instances[sterm_objId]) {
                                    query_sig[i].instances[sterm_objId]++;
                                } else {
                                    query_sig[i].instances[sterm_objId] = 1;
                                }
                            } else {
                                query_sig[i].instances = {};
                                query_sig[i].instances[sterm_objId] = 1;
                            }

                            break outter;
                        }
                    }

                    var info_to_store = {'count': 1, 'sig': sig, instances: {}};
                    info_to_store.instances[sterm_objId] = 1;
                    query_sig.push(info_to_store);


                }
                if (!isEqualObjSig(query_sig.lastHiddenClass, sig)) {
                    query_sig.classChangeCnt++;
                }
                query_sig.totalCnt++;
                query_sig.lastHiddenClass = sig;
            }
        }

        var consStack = (function () {
            var stack = [
                {}
            ];
            return {
                push: function (f, isConstructor, iid) {
                    stack.push({"fun": f, "isCon": isConstructor, 'iid': iid});
                },
                pop: function () {
                    return stack.pop();
                },
                isConstructor: function (dis) {
                    var elem = stack[stack.length - 1];
                    return elem.isCon && dis instanceof elem.fun;
                },
                peek: function () {
                    return stack[stack.length - 1];
                }
            }
        }());

        function checkUpdateObjIdSync(obj) {
            if (obj) {
                var shadow_obj = smemory.getShadowObject(obj);
                if (shadow_obj) {
                    if (consStack.isConstructor(obj)) { // update the objId
                        // obj id to the object instance to be created
                        if (!shadow_obj.objId) {
                            shadow_obj.objId = '(id: ' + db.getNextObjId() + ' iid: ' + consStack.peek().iid + ')';
                        }
                    }
                    if (shadow_obj.objId && shadow_obj.sig && (shadow_obj.sig.sterm_objId === 'unknown(external)' || !shadow_obj.sig.sterm_objid)) {
                        shadow_obj.sig.sterm_objId = shadow_obj.objId;
                    }
                }
            }
        }


        // ---- JIT library functions end ----


        this.getFieldPre = function (iid, base, offset) {
            checkUpdateObjIdSync(base);
        }

        this.getField = function (iid, base, offset, val) {
            if (base) {
                checkIfObjectIsPolymorphic(base, iid);
            }
            return val;
        }

        this.putField = function (iid, base, offset, val) {
            // update object's shadow signature
            updateObjSig(base);
            return val;
        }

        this.literalPre = function (iid, val) {
            if (!val) return;

            var shadow_obj = smemory.getShadowObject(val);
            if (shadow_obj && !shadow_obj.objId) {
                shadow_obj.objId = '(id: ' + db.getNextObjId() + ' iid: ' + iid + ')';
            }
        }

        this.invokeFunPre = function (iid, f, base, args, isConstructor) {
            consStack.push(f, isConstructor, iid);
        }

        var currentFunctionIID;
        var currentFunctionObtainedFromFe;
        this.functionEnter = function (iid, val, dis) {
            currentFunctionIID = iid;
            currentFunctionObtainedFromFe = val;
        }

        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            checkUpdateObjIdSync(val);
            if (isConstructor) { // check the return value of the constructor
                // if we can get the function enter event ==> we have instrumented its source code
                if (currentFunctionObtainedFromFe === f) {
                    checkIfObjectIsPolymorphic(val, currentFunctionIID, 'constructor');
                }
            }
            consStack.pop();
            return val;
        }

        this.endExecution = function () {
            this.printResult();
        }

        this.printResult = function () {
            try {
                console.log("----------------------------");
                console.log('Report of polymorphic statements:');
                printPolymorphicInfo();
            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new OldHiddenClassSimulation();

})(J$));
