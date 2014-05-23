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

J$.analysis = {};

((function (sandbox) {
    function PolymorphicFunCall() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;
        var smemory = sandbox.smemory;

        var RuntimeDB = require(__dirname + '/utils/RuntimeDB.js');
        var storeDB = new RuntimeDB();
        var Utils = require(__dirname + '/utils/Utils.js');

        var warning_limit = 30;

        // ---- JIT library functions start ----

        function printPolymorphicFunCall(indexArr) {
            var array = [];
            var db = storeDB.getByIndexArr(indexArr);
            var num = 0;
            for (var defiid in db) {
                if (HOP(db, defiid)) {
                    var total = 0;
                    var finalscore = 0;
                    var innerDB = db[defiid];
                    var set = {};
                    var uniquetypenum = 0;
                    for (var invokeiid in innerDB) {
                        var ninvoke = 0;
                        if (HOP(innerDB, invokeiid)) {
                            var innerMostDB = innerDB[invokeiid];
                            var count;
                            var signum = 0;
                            for (var callsig in innerMostDB) {
                                if (HOP(innerMostDB, callsig)) {

                                    count = innerMostDB[callsig].count
                                    ninvoke += count;
                                    total += count;
                                    signum++;

                                    if (!set[callsig]) {
                                        set[callsig] = true;
                                        uniquetypenum++;
                                    }
                                }
                            }
                            finalscore += (ninvoke / signum);
                        }
                    }
                    if (uniquetypenum > 1) {
                        array.push({'iid': defiid, 'score': finalscore, 'total': total});
                        num++;
                    }
                }
            }
            array.sort(function compare(a, b) {
                return b.score - a.score;
            });
            for (var i = 0; i < array.length && i < warning_limit; i++) {
                var iid = array[i].iid;
                console.log(' * [location: ' + iidToLocation(array[i].iid) + '] <- No. usages: ' + (array[i].total));
                var innerDB = db[iid];
                for (var invokeiid in innerDB) {
                    if (HOP(innerDB, invokeiid)) {
                        console.log('\t[invoke location] ' + iidToLocation(invokeiid));
                        var innerMostDB = innerDB[invokeiid];
                        for (var callsig in innerMostDB) {
                            if (HOP(innerMostDB, callsig)) {
                                console.log('\t\tNo. usages: ' + innerMostDB[callsig].count + ' | type: ' + callsig);
                            }
                        }
                    }
                }
            }
            console.log('Number of polymorphic function call: ' + num);
        }



        function checkPolymorphicFunCall(args, iid, invokeLocIid) {
            var callsig = '|'
            for (var i = 0; i < args.length; i++) {
                callsig += (typeof (args[i])) + '|';
            }
            storeDB.addCountByIndexArr(['JIT-checker', 'polymorphic-fun-call', iid, cachedInvokeLocation, callsig]);
        }

        // ---- JIT library functions end ----

        var cachedArgs;
        var cachedInvokeLocation;
        var isAnalyzePolymorphicFunCall;
        this.invokeFunPre = function (iid, f, base, args, isConstructor) {
            cachedArgs = args;
            cachedInvokeLocation = iid;
            if (isConstructor) { // do not analyze polymorphic function call for constructor, as it is difficult to refactor
                isAnalyzePolymorphicFunCall = false;
            } else {
                isAnalyzePolymorphicFunCall = true
            }
        }

        var currentFunctionIID;
        var currentFunctionObtainedFromFe;
        this.functionEnter = function (iid, val, dis) {
            currentFunctionIID = iid;
            currentFunctionObtainedFromFe = val;
            if (isAnalyzePolymorphicFunCall) {
                checkPolymorphicFunCall(cachedArgs, iid, cachedInvokeLocation);
            }
        }

        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            return val;
        }

        this.endExecution = function () {
            console.log('\n\n');
            this.printResult();
        }


        this.printResult = function () {
            try {
                console.log("---------------------------");

                console.log('Report of polymorphic function call:');
                printPolymorphicFunCall(['JIT-checker', 'polymorphic-fun-call']);

            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new PolymorphicFunCall();

})(typeof J$ === 'undefined' ? (J$ = {}) : J$));
