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
 * Check Rule: Try not to use polymorphic binary/unary operations
 * This checker detects polymorphic binary/unary operations
 *
 * For example:
 *
 * function f(a, b) {
 *     return a + b;
 * }
 *
 * f(1, 2);
 * f('a', 'b'); // make the statement inside the funciton polymorphic
 *
 * It makes the JIT-compiler hard to do optimization as the function
 * has to consider more cases and thus insert more runtime checks
 *
 * This analysis monitors each binary/unary operation and associate with each
 * of those operations its parameter type combinations.
 * for example here after first call
 * a + b <- {(int, int)}
 * after second call:
 * a + b <- {(int, int), (string, string)}
 *
 */

((function (sandbox) {
    function PolymorphicOps() {
        var Constants = sandbox.Constants;
        var HOP = Constants.HOP;
        var iidToLocation = sandbox.iidToLocation;
        var sort = Array.prototype.sort;

        var RuntimeDB = sandbox.RuntimeDB;
        var storeDB = new RuntimeDB();

        var warning_num = 0;
        var MISS_THRESHOLD = 999;

        // ---- Print functions start ----

        function printPolyBinary(indexArr) {
            var array = [];
            var db = storeDB.getByIndexArr(indexArr);
            var num = 0;
            for (var iid in db) {
                if (HOP(db, iid)) {
                    if(db[iid].miss > MISS_THRESHOLD) {
                        db[iid].iid = iid;
                        array.push(db[iid]);
                    }
                }
            }
            array.sort(function compare(a, b) {
                return b.miss - a.miss;
            });
            for (var i = 0; i < array.length; i++) {
                var iid = array[i].iid;
                warning_num++;
                console.log('* Polymorphic binary operation at ' + iidToLocation(iid));
                console.log('\tHit: ' + array[i].hit + '\tMiss: ' + array[i].miss);
                var len = array[i].types.length;
                for (var index =0; index < len; index++) {
                    if(HOP(array[i].types, index)) {
                        var left_type_name = getTypeName(array[i].types[index].left_type);
                        var right_type_name = getTypeName(array[i].types[index].right_type);
                        console.log('\tCount: ' + array[i].types[index].count + 
                            '\ttypes: ' + left_type_name + ' ' + array[i].operator + ' ' + right_type_name);
                    }
                }
            }
        }

        function printPolyUnary(indexArr) {
            var array = [];
            var db = storeDB.getByIndexArr(indexArr);
            var num = 0;
            for (var iid in db) {
                if (HOP(db, iid)) {
                    if(db[iid].miss > MISS_THRESHOLD) {
                        db[iid].iid = iid;
                        array.push(db[iid]);
                    }
                }
            }

            array.sort(function compare(a, b) {
                return b.miss - a.miss;
            });
            for (var i = 0; i < array.length; i++) {
                var iid = array[i].iid;
                warning_num++;
                console.log('* Polymorphic unary operation at ' + iidToLocation(iid));
                console.log('\tHit: ' + array[i].hit + '\tMiss: ' + array[i].miss);
                var len = array[i].types.length;
                for (var index =0; index < len; index++) {
                    if(HOP(array[i].types, index)) {
                        var left_type_name = getTypeName(array[i].types[index].left_type);
                        console.log('\tCount: ' + array[i].types[index].count + 
                            '\ttypes:   ' + array[i].operator + ' ' + left_type_name);
                    }
                }
            }
        }

        this.printResult = function () {
            try {
                console.log("---------------------------");
                console.log('Report of Polymorphic Binary Operations:');
                printPolyBinary(['JIT-checker', 'polymorphic-binary']);
                console.log('Report of Polymorphic Unary Operations:');
                printPolyUnary(['JIT-checker', 'polymorphic-unary']);
                console.log('[****]PolyFun: ' + warning_num);
            } catch (e) {
                console.log("error!!");
                console.log(e);
            }
        }

        // ---- Print functions end ----

        // ---- Logic starts ----

        var UNDEFINED_TYPE = 0;
        var INTEGER_TYPE = 1;
        var FLOAT_TYPE = 2;
        var STRING_TYPE = 3;
        var BOOLEAN_TYPE = 4;
        var OTHER_TYPE = 5;

        function getType(val) {
            switch(typeof val) {
                case 'number':
                    //if(parseInt(val) === val) return INTEGER_TYPE;
                    //else return FLOAT_TYPE;
                    return FLOAT_TYPE;
                case 'undefined':
                    return UNDEFINED_TYPE;
                case 'string':
                    return STRING_TYPE;
                case 'boolean':
                    return BOOLEAN_TYPE;
                default:
                    return OTHER_TYPE;
            }
        }

        function getTypeName(val) {
            switch(val) {
                case UNDEFINED_TYPE:
                    return 'undefined';
                case INTEGER_TYPE:
                    //return 'integer';
                case FLOAT_TYPE:
                    return 'float';
                case STRING_TYPE:
                    return 'string';
                case BOOLEAN_TYPE:
                    return 'boolean';
                case OTHER_TYPE:
                    return 'other';
            }
        }

        function isPolyBinary(iid, op, left, left_type, right, right_type) {
            if(op === 'instanceof' || op === 'typeof' || op === '==' || op === '!=' || op === '===' || op === '!=') {
                return false;
            }

            if(op === '<' || op === '>' || op === '<=' || op === '>=') {
                return false;
            }

            return true;
        }

        // check polymorphic binary operation
        function checkPolyBinaryOp(iid, op, left, right) {
            var db, left_type, right_type, types_index;
            left_type = getType(left);
            right_type = getType(right);

            if(!isPolyBinary(iid, op, left, left_type, right, right_type)) {
                return ;
            }

            db = storeDB.getByIndexArr(['JIT-checker', 'polymorphic-binary', iid]);
            types_index = left_type * 10 + right_type;
            if(!db) {
                db = {
                    last_left: left_type, 
                    last_right: right_type,
                    operator: op, hit: 0, miss: 0,
                    types: []
                };
                db.types[types_index] = {left_type: left_type, right_type: right_type, count: 1};
                storeDB.setByIndexArr(['JIT-checker', 'polymorphic-binary', iid], db);
            } else {
                if(db.last_left !== left_type || db.last_right !== right_type) {
                    db.last_left = left_type;
                    db.last_right = right_type;
                    db.miss++;
                } else {
                    db.hit++;
                }
                if(db.types[types_index]) {
                    db.types[types_index].count++;
                } else {
                    db.types[types_index] = {left_type: left_type, 
                        right_type: right_type, count: 1};
                }
            }
        }

        function isUnaryOp(iid, op, left, left_type) {
            if(op === 'typeof') {
                return false;
            }

            return true;
        }

        // check polymorphic unary operation
        function checkPolyUnaryOp(iid, op, left) {
            var db, left_type, types_index;
            left_type = getType(left);
            db = storeDB.getByIndexArr(['JIT-checker', 'polymorphic-unary', iid]);
            types_index = left_type;
            if(!db) {
                db = {
                    last_left: left_type,
                    operator: op,
                    hit: 0, miss: 0,
                    types: []
                };
                db.types[types_index] = {left_type: left_type, count: 1};
                storeDB.setByIndexArr(['JIT-checker', 'polymorphic-unary', iid], db);
            } else {
                if(db.last_left !== left_type) {
                    db.last_left = left_type;
                    db.miss++;
                } else {
                    db.hit++;
                }
                if(db.types[types_index]) {
                    db.types[types_index].count++;
                } else {
                    db.types[types_index] = {left_type: left_type, count: 1};
                }
            }
        }

        // ---- Logic ends ----


        this.binaryPre = function (iid, op, left, right) {
            checkPolyBinaryOp(iid, op, left, right);
        };

        this.unaryPre = function (iid, op, left) {
            checkPolyUnaryOp(iid, op, left);
        };

        this.endExecution = function () {
            this.printResult();
        };
    }

    sandbox.analysis = new PolymorphicOps();

})(J$));
