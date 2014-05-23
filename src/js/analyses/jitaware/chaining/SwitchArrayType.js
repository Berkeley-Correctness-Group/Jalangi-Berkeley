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
    function SwitchArrayType() {
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

        function checkIfArrayIsNumeric(base, val, iid) {
            // attach a meta data 'numeric' or 'non-numeric' to this array
            // if the meta data does not exist, check the type of this array
            var shadow = smemory.getShadowObject(base);
            if (shadow && shadow.arrType === undefined) {
                var all_undefined = true;
                shadow.arrType = 'unknown';
                inner:
                    for (var i = 0; i < base.length; i++) {
                        if (typeof base[i] !== 'undefined') {
                            all_undefined = false;
                        }
                        if (typeof base[i] !== 'number' && typeof base[i] !== 'undefined') {
                            shadow.arrType = 'non-numeric';
                            all_undefined = false;
                            break inner;
                        }
                        //console.log(JSON.stringify(base));
                        shadow.arrType = 'numeric';
                    }
                if (all_undefined) {
                    shadow.arrType = 'unknown';
                }
            }

            // for now this code does not check switching from non-numeric array to numeric, as it might be expensive
            if (shadow && shadow.arrType === 'numeric') {
                if (typeof val !== 'number' && typeof val !== 'undefined') {
                    db.addCountByIndexArr(['JIT-checker', 'arr-type-switch', iid]);
                    shadow.arrType = 'non-numeric';
                }
            }

            if (shadow && shadow.arrType === 'unknown') {
                if (typeof val === 'number') {
                    shadow.arrType = 'numeric';
                } else if (typeof val === 'undefined') {
                    // do nothing, type remain unknown
                } else {
                    shadow.arrType = 'non-numeric';
                }
            }
        }

        // ---- JIT library functions end ----

        this.putFieldPre = function (iid, base, offset, val) {
            if (base !== null && base !== undefined) {
                if (Utils.isArr(base) && Utils.isNormalNumber(offset)) {
                    checkIfArrayIsNumeric(base, val, iid);
                }
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
                console.log('Report of switching array type');
                var switchArrTypeArr = [];
                var switchArrTypeDB = db.getByIndexArr(['JIT-checker', 'arr-type-switch']);
                var num = 0;
                for (var prop in switchArrTypeDB) {
                    if (HOP(switchArrTypeDB, prop)) {
                        switchArrTypeArr.push({'iid': prop, 'count': switchArrTypeDB[prop].count});
                        num++;
                    }
                }
                switchArrTypeArr.sort(function compare(a, b) {
                    return b.count - a.count;
                });
                for (var i = 0; i < switchArrTypeArr.length && i < warning_limit; i++) {
                    console.log(' * [location: ' + iidToLocation(switchArrTypeArr[i].iid) + '] <- No. usages: ' + switchArrTypeArr[i].count);
                }
                console.log('...');
                console.log('Number of switching array type spotted: ' + num);
                console.log("---------------------------");

            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }
    }

    sandbox.analysis = new SwitchArrayType();

})(J$);

