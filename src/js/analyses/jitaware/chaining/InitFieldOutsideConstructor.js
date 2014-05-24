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
 * Check Rule: Do not initialize fields of an object outside its constructor
 *
 * It makes V8 hard to predicate the object's type and thus prevents optimization.
 * This analysis simulates the stack track and detect field initializations
 * outside a constructor
 *
 */

((function (sandbox) {
    function InitFieldOutsideConstructor() {
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

        function checkIfFieldAddedOutsideConstructor(base, offset, iid) {
            if (!HOP(base, offset)) { // check init object members in non-consturctor functions
                if (!consStack.isConstructor(base)) {
                    db.addCountByIndexArr(['JIT-checker', 'init-obj-nonconstr', iid]);
                }
            }
        }

        // ---- JIT library functions end ----

        this.putFieldPre = function (iid, base, offset, val) {
            if (base !== null && base !== undefined) {
                if (!Utils.isArr(base) || !Utils.isNormalNumber(offset)) {
                    checkIfFieldAddedOutsideConstructor(base, offset, iid);
                }
            }
            return val;
        }

        this.invokeFunPre = function (iid, f, base, args, isConstructor) {
            consStack.push(f, isConstructor, iid);
        }

        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            consStack.pop();
            return val;
        }

        this.endExecution = function () {
            this.printResult();
        }

        this.printResult = function () {
            try {
                console.log("---------------------------");

                console.log('Report of initialize object field in non-constructor:');
                var initObjNonConstrArr = [];
                var initObjNonConstrDB = db.getByIndexArr(['JIT-checker', 'init-obj-nonconstr']);
                var num = 0;
                for (var prop in initObjNonConstrDB) {
                    if (HOP(initObjNonConstrDB, prop)) {
                        initObjNonConstrArr.push({'iid': prop, 'count': initObjNonConstrDB[prop].count});
                        num++;
                    }
                }
                initObjNonConstrArr.sort(function compare(a, b) {
                    return b.count - a.count;
                });
                for (var i = 0; i < initObjNonConstrArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(initObjNonConstrArr[i].iid) + '] <- No. usages: ' + initObjNonConstrArr[i].count);
                }
                console.log('Number of statements init objects in non-constructor: ' + num);

            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new InitFieldOutsideConstructor();

})(J$));
