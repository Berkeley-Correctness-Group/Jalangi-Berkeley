/*
 * Copyright 2014 University of California, Berkeley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function(module) {

    function TypeAnalysisEngine2(executionIndex) {

        // data structures
        function TypePair(leftType, rightType, resultType, leftValue, rightValue, resultValue) {
            this.leftType = leftType;
            this.rightType = rightType;
            this.resultType = resultType;
            this.leftValue = leftValue;
            this.rightValue = rightValue;
            this.resultValue = resultValue;
        }

        // state
        var locationAndOp2TypePairs = {}; // string --> array of TypePairs

        // functions
        function typeOf(v) {
            if (typeof v === "undefined")
                return "undefined";
            if (v === null)
                return "null";
            if (v !== v)
                return "NaN";
            var s = Object.prototype.toString.call(v);
            if (s === "[object Array]")
                return "array";
            if (v === "")
                return "emptyString";
            if (v.nodeName)
                return "domElement";
            else if (typeof v === "object" && typeof v.length === "number") {
                if (v.callee)
                    return "arguments";
                if ("item" in v)
                    return "htmlCollection";
            }
            if (typeof v === "object")
                return s;

            return typeof v;
        }

        function toString(v) {
            if (typeof v === "undefined")
                return "undefined";
            if (v === null)
                return "null";
            if (v !== v)
                return "NaN";
            var t = Object.prototype.toString.call(v);
            if (t === "[object String]")
                return v;
            if (t === "[object Number]" ||
                t === "[object Boolean]")
                return v.toString();
            return "<ref>";
        }

        function addTypePair(location, op, typePair) {
            var locationAndOp = op+" at "+location;
            var pairs = locationAndOp2TypePairs[locationAndOp] || [];
            pairs.push(typePair);
            locationAndOp2TypePairs[locationAndOp] = pairs;
        }

        function logResult() {
            var output = JSON.stringify(locationAndOp2TypePairs);
            window.$jalangiFFLogResult(output, true);
            locationAndOp2TypePairs = {};
        }

        // hooks
        this.declare = function(iid, name, val, isArgument) {
        };

        this.literalPre = function(iid, val) {
        };

        this.literal = function(iid, val) {
            return val;
        };

        this.invokeFunPre = function(iid, f, base, args, isConstructor) {
        };

        this.invokeFun = function(iid, f, base, args, val, isConstructor) {
            return val;
        };

        this.getFieldPre = function(iid, base, offset) {
        };

        this.getField = function(iid, base, offset, val) {
            return val;
        };

        this.putFieldPre = function(iid, base, offset, val) {
            return val;
        };

        this.putField = function(iid, base, offset, val) {
            return val;
        };

        this.readPre = function(iid, name, val, isGlobal) {

        };

        this.read = function(iid, name, val, isGlobal) {
            return val;
        };

        this.writePre = function(iid, name, val, oldValue) {
        };

        this.write = function(iid, name, val, oldValue) {
            return val;
        };

        this.binaryPre = function(iid, op, left, right) {
        };

        this.binary = function(iid, op, left, right, result_c) {
//      console.log("binary op "+op+" -- "+typeof op+", left: "+left+" -- "+typeof left+", right: "+right+" -- "+typeof right+", result: "+result_c+" -- "+typeof result_c);

            // TODO find better way to reduce the overhead
            if (!(op === "===" || op === "==" || op === "!=" || op === "==" || op === "instanceof")) {

                var leftType = typeOf(left);
                var rightType = typeOf(right);

//                if (leftType !== rightType) {
                    var leftValue = toString(left);
                    var rightValue = toString(right);
                    var resultType = typeOf(result_c);
                    var resultValue = toString(result_c);
                    var typePair = new TypePair(leftType, rightType, resultType, leftValue, rightValue, resultValue);
                    addTypePair(iid, op, typePair);
//                }
            }

            return result_c;
        };

        this.unaryPre = function(iid, op, left) {
        };

        this.unary = function(iid, op, left, result_c) {
            return result_c;
        };

        this.conditionalPre = function(iid, left) {
        };

        this.conditional = function(iid, left, result_c) {

            return left;
        };

        this.beginExecution = function(data) {
        };

        this.functionEnter = function(iid, fun, dis /* this */) {
        };

        this.functionExit = function(iid) {
            return false;
            /* a return of false means that do not backtrack inside the function */
        };

        this.return_ = function(val) {
            return val;
        };

        this.scriptEnter = function(iid, fileName) {
        };

        this.scriptExit = function(iid) {
        };
        
        window.addEventListener("beforeunload", function() {
            console.log("beforeunload --> logging results");
            logResult();
        }, false);


    }

    module.analysis = new TypeAnalysisEngine2();
}(J$));