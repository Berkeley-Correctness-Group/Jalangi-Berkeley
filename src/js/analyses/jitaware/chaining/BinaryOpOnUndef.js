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
    function BinaryOpOnUndef() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;
        var smemory = sandbox.smemory;

        var RuntimeDB = require(__dirname + '/utils/RuntimeDB.js');
        var db = new RuntimeDB();
        var Utils = require(__dirname + '/utils/Utils.js');

        var warning_limit = 30;

        // ---- JIT library functions start ----

        function checkBinaryOpOnUndefined(iid, op, left, right) {
            if (typeof left === 'undefined' || typeof right === 'undefined') {
                if (op === '|' || op === '^' || op === '&' || op === '~' || op === '+' || op === '-' || op === '*' || op === '/' || op === '%') {
                    db.addCountByIndexArr(['JIT-checker', 'binary-undefined-op', iid]);
                }
            }
        }

        // ---- JIT library functions end ----

        this.endExecution = function () {
            console.log('\n\n');
            this.printResult();
        }

        this.binaryPre = function (iid, op, left, right) {
            checkBinaryOpOnUndefined(iid, op, left, right);
        }

        this.printResult = function () {
            try {
                console.log("---------------------------");

                console.log('Report of binary operation on undefined value:');
                var binaryUndefinedArr = [];
                var binaryUndefinedDB = db.getByIndexArr(['JIT-checker', 'binary-undefined-op']);
                var num = 0;
                for (var prop in binaryUndefinedDB) {
                    if (HOP(binaryUndefinedDB, prop)) {
                        binaryUndefinedArr.push({'iid': prop, 'count': binaryUndefinedDB[prop].count});
                        num++;
                    }
                }
                binaryUndefinedArr.sort(function compare(a, b) {
                    return b.count - a.count;
                });
                for (var i = 0; i < binaryUndefinedArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(binaryUndefinedArr[i].iid) + '] <- No. usages: ' + binaryUndefinedArr[i].count);
                }
                console.log('Number of statements that perform binary operation on undefined values: ' + num);

            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new BinaryOpOnUndef();

})(J$));

