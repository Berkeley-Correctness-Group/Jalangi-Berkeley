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
    function AccessUndefArrayElem() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;

        var RuntimeDB = require(__dirname + '/utils/RuntimeDB.js');
        var db = new RuntimeDB();
        var Utils = require(__dirname + '/utils/Utils.js');

        var warning_limit = 30;

        // ---- JIT library functions start ----

        function checkIfReadingAnUninitializedArrayElement(base, offset, iid) {
            if (Utils.isArr(base)) {
                // check using uninitialized
                if (Utils.isNormalNumber(offset) && !HOP(base, offset + '')) {
                    db.addCountByIndexArr(['JIT-checker', 'uninit-array-elem', iid]);
                }
            }
        }


        // ---- JIT library functions end ----

        this.getField = function (iid, base, offset, val) {
            if (base) {
                checkIfReadingAnUninitializedArrayElement(base, offset, iid);
            }
            return val;
        }


        this.endExecution = function () {
            console.log('\n\n');
            this.printResult();
        }

        this.printResult = function () {
            try {
                console.log("---------------------------");

                console.log('Report of loading undeclared or deleted array elements:')
                var uninitArrDB = db.getByIndexArr(['JIT-checker', 'uninit-array-elem']);
                var num = 0;
                var jitUninitArr = [];
                for (var prop in uninitArrDB) {
                    if (HOP(uninitArrDB, prop)) {
                        jitUninitArr.push({'iid': prop, 'count': uninitArrDB[prop].count});
                        num++;
                    }
                }
                sort.call(jitUninitArr, function compare(a, b) {
                    return b.count - a.count;
                });

                for (var i = 0; i < jitUninitArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(jitUninitArr[i].iid) + '] <- No. usages: ' + jitUninitArr[i].count);
                }
                console.log('...');
            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new AccessUndefArrayElem();

})(J$));