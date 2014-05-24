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

/**
 * Check Rule: Do not leak arguments object of an function
 *
 * There are numerous ways to use arguments in a way that causes
 * the function to be unoptimizable. One must be extremely careful when using arguments.
 *
 * leaking arguments prevents JIT-compiler optimization, for example:
 * function f() {
 *     return arguments;
 * }
 *
 * This analysis checks if an arguments object is used as return value
 * or get assigned to a global variable
 *
 */

((function (sandbox) {
    function ArgumentsLeak() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;
        var smemory = sandbox.smemory;

        var RuntimeDB = sandbox.RuntimeDB;
        var db = new RuntimeDB();
        var Utils = sandbox.Utils;

        var warning_limit = 30;

        // ---- JIT library functions start ----

        function checkArgumentsObjLeaking(iid, val) {
            if(val){
                var shadow_obj = smemory.getShadowObject(val);
                if(shadow_obj && shadow_obj.isArgumentsObj) {
                    db.addCountByIndexArr(['JIT-checker', 'arguments-obj-leaking', iid]);
                }
            }
        }

        var indirectEval = eval;
        function getGlobalVariableByName(name) {
            var value;
            try{
                value = indirectEval(name);
            }catch(e){ /*console.log(e)*/ }
            return value;
        }

        // ---- JIT library functions end ----

        var lastReadIID;
        this.read = function (iid, name, val, isGlobal) {
            lastReadIID = iid;
            if(name === 'arguments') {
                var shadow_obj = smemory.getShadowObject(val);
                shadow_obj.isArgumentsObj = true;
            }
            return val;
        }

        this.return_ = function (val) {
            checkArgumentsObjLeaking(lastReadIID, val);
            return val;
        }

        this.write = function (iid, name, val) {
            //check assigning arguments to a global variable
            //var global = getGlobal();
            if (typeof getGlobalVariableByName(name) !== 'undefined') {
                checkArgumentsObjLeaking(iid, val);
            }
            return val;
        }

        this.endExecution = function () {
            this.printResult();
        }


        this.printResult = function () {
            try {
                console.log("---------------------------");
                console.log('Report of arguments leaking:');
                var argsLeakingArr = [];
                var argsLeakingDB = db.getByIndexArr(['JIT-checker', 'arguments-obj-leaking']);
                num = 0;
                for (var prop in argsLeakingDB) {
                    if (HOP(argsLeakingDB, prop)) {
                        argsLeakingArr.push({'iid': prop, 'count': argsLeakingDB[prop].count});
                        num++;
                    }
                }
                argsLeakingArr.sort(function compare(a, b) {
                    return b.count - a.count;
                });
                for (var i = 0; i < argsLeakingArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(argsLeakingArr[i].iid) + '] <- No. usages: ' + argsLeakingArr[i].count);
                }
                console.log('Number of statements that leaks arguments object: ' + num);
            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new ArgumentsLeak();

})(J$));
