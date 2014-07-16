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
 * Check Rule: Do not use non-contiguous arrays
 *
 * Non-contiguous array is not as efficient as contiguous array,
 * try not to use it.
 *
 * This analysis detects operations that writes to array index larger than array length.
 * for example:
 * var arr = [1,2];
 * arr[6] = 1; // creates non-contiguous array;
 *
 */

((function (sandbox) {
    function NonContiguousArray() {
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
        function checkIfWritingOutsideArrayBound(base, offset, iid) {
            if (base.length < offset) {
                db.addCountByIndexArr(['JIT-checker', 'non-cont-array', iid]);
            }
        }

        // ---- JIT library functions end ----

        this.putFieldPre = function (iid, base, offset, val) {
            if (base !== null && base !== undefined) {
                if (Utils.isArr(base) && Utils.isNormalNumber(offset)) {
                    checkIfWritingOutsideArrayBound(base, offset, iid);
                }
            }
            return val;
        }

        this.endExecution = function () {
            this.printResult();
        }

        this.printResult = function () {
            try {
                console.log("---------------------------");
                console.log('Report of making non-contiguous array:')
                var incontArrDBArr = [];
                var incontArrDB = db.getByIndexArr(['JIT-checker', 'non-cont-array']);
                var num = 0;
                for (var prop in incontArrDB) {
                    if (HOP(incontArrDB, prop)) {
                        incontArrDBArr.push({'iid': prop, 'count': incontArrDB[prop].count});
                        num++;
                    }
                }
                incontArrDBArr.sort(function compare(a, b) {
                    return b.count - a.count;
                });
                for (var i = 0; i < incontArrDBArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(incontArrDBArr[i].iid) + '] <- No. usages: ' + incontArrDBArr[i].count);
                }
                console.log('...');
                console.log('Number of putting non-contiguous array statements: ' + num);
                console.log('[****]NonContArray: ' + num);
                console.log('Why: In order to handle large and sparse arrays, there are two types of array storage internally:\n' +
                    '\t * Fast Elements: linear storage for compact key sets\n' +
                    '\t * Dictionary Elements: hash table storage otherwise\n' +
                    'It\'s best not to cause the array storage to flip from one type to another.');

            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new NonContiguousArray();

})(J$));
