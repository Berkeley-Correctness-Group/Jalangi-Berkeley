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

(function(sandbox) {
    function TypeAnalysisEngine() {

        var util = importModule("CommonUtil");
        var constants = importModule("Constants");

        // data structures

        /*
         * Unary operation (may coerce types or not).
         */
        function UnaryObservation(iid, isStrict, operation, type, extraTypeInfo, resultType, value, resultValue) {
            this.kind = operation === "conditional" ? "conditional" : "unary";
            this.iid = iid;
            this.isStrict = isStrict;
            this.operation = operation;
            this.type = type;
            this.extraTypeInfo = extraTypeInfo;
            this.resultType = resultType;
            this.value = value;
            this.resultValue = resultValue;
            this.hash = util.stringToHash(hashSeed + iid + operation + type + extraTypeInfo + value + isStrict);
        }

        /*
         * Binary operation (may coerce types or not).
         */
        function BinaryObservation(iid, isStrict, operation, leftType, leftExtraTypeInfo, rightType, rightExtraTypeInfo, resultType, leftValue, rightValue, resultValue) {
            this.kind = "binary";
            this.iid = iid;
            this.isStrict = isStrict;
            this.operation = operation;
            this.leftType = leftType;
            this.leftExtraTypeInfo = leftExtraTypeInfo;
            this.rightType = rightType;
            this.rightExtraTypeInfo = rightExtraTypeInfo;
            this.resultType = resultType;
            this.leftValue = leftValue;
            this.rightValue = rightValue;
            this.resultValue = resultValue;
            this.hash = util.stringToHash(hashSeed + iid + operation + leftType + leftExtraTypeInfo + rightType + rightExtraTypeInfo + resultType + leftValue + rightValue + resultValue + isStrict);
        }

        /*
         * Explicit type conversion, e.g., Boolean(..).
         */
        function ExplicitObservation(iid, isStrict, operation, inputType, extraTypeInfo, outputType, inputValue, outputValue) {
            this.kind = "explicit";
            this.iid = iid;
            this.isStrict = isStrict;
            this.operation = operation;
            this.inputType = inputType;
            this.extraTypeInfo = extraTypeInfo;
            this.outputType = outputType;
            this.inputValue = inputValue;
            this.outputValue = outputValue;
            this.hash = util.stringToHash(hashSeed + iid + operation + inputType + extraTypeInfo + outputType + inputValue + outputValue + isStrict);
        }

        // state
        var hashSeed = Date.now();
        var hashToObservation = {}; // number --> UnaryObservation | BinaryObservation | ExplicitObservation
        var hashToFrequency = {};   // number --> number
        var hashToCallIDs = {};     // number --> set of numbers
        var obsCtr = 0;
        var currentCallID = 0;
        var maxCallID = 0;

        // functions
        function toTypeString(v) {
            if (typeof v === "undefined")
                return "undefined";
            if (v === null)
                return "null";
//            if (v !== v)   // commented to handle NaN as a number
//                return "NaN";
            var s = Object.prototype.toString.call(v);
            if (s === "[object Array]")
                return "array";
            if (typeof v === "object")
                return s;
            return typeof v;
        }

        function toValueString(v) {
            if (typeof v === "undefined")
                return "undefined";
            if (v === null)
                return "null";
            if (v !== v)
                return "NaN";
            var t = typeof v;
            if (t === "string") {
                if (v)  // abstract string to empty or non-empty (to save space)
                    return "someString";
                else
                    return "";
            } else if (t === "number") {
                if (v === 0)
                    return 0;
                else
                    return 42;   // abstract all non-zero number to 42 (to allow for merging observations)
            } else if (t === "boolean") {
                return v;   // for booleans, store the actual value
            } else if (t === "object" && Object.prototype.toString.call(v) === "[object Array]" && v.length === 0) {
                return "[]";
            } else if (t === "object" && Object.prototype.toString.call(v) === "[object Object]" && Object.keys(v).length === 0) {
                return "{}";
            } else {
                return "<ref>";
            }
        }

        function addObservation(obs) {
            if (!util.HOP(hashToObservation, obs.hash)) {
                hashToObservation[obs.hash] = obs;
            }
            var oldFreq = hashToFrequency[obs.hash] || 0;
            hashToFrequency[obs.hash] = oldFreq + 1;

            var callIDs = hashToCallIDs[obs.hash] || {};
            callIDs[currentCallID] = true;
            hashToCallIDs[obs.hash] = callIDs;

            obsCtr++;
        }

        function isStrict() {
            return !this;
        };

        function hasToString(obj) {
            if (!obj) return false;
            var t = typeof obj;
            if (t === "number" || t === "boolean" || t === "string") return false;
            try {
                return obj.toString && obj.toString !== Object.prototype.toString;
            } catch (e) {
                return false; // to deal w/ objects where accessing valueOf throws "permission denied"
            }
        }

        function hasValueOf(obj) {
            if (!obj) return false;
            var t = typeof obj;
            if (t === "number" || t === "boolean" || t === "string") return false;
            try {
                return obj.valueOf && obj.valueOf !== Object.prototype.valueOf;
            } catch (e) {
                return false; // to deal w/ objects where accessing valueOf throws "permission denied"
            }
        }

        function typeOfValueOf(obj) {
            var v = obj.valueOf();
            return toTypeString(v);
        }

        function extraTypeInfo(v) {
            var hasVO = hasValueOf(v);
            return constants.createExtraTypeInfo(hasToString(v), hasVO, hasVO ? typeOfValueOf(v) : undefined);
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
            if (!isConstructor && (f.name === "Number" || f.name === "Boolean" || f.name === "String" || f.name === "Object")) {
                var obs = new ExplicitObservation(iid, isStrict(), f.name, toTypeString(args[0]), extraTypeInfo(args[0]), toTypeString(val), toValueString(args[0]), toValueString(val));
                addObservation(obs);
            }
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
            if (op !== "instanceof" && op !== "in" && op !== "delete") {
                var leftType = toTypeString(left);
                var rightType = toTypeString(right);
                var resultType = toTypeString(result_c);
                var obs;
                if (!(leftType === rightType && rightType === resultType)) {
                    obs = new BinaryObservation(iid, isStrict(), op, leftType, extraTypeInfo(left), rightType, extraTypeInfo(right), resultType,
                          toValueString(left), toValueString(right), toValueString(result_c));  // record values only for type coercions (for efficiency)
                } else {
                    obs = new BinaryObservation(iid, isStrict(), op, leftType, extraTypeInfo(left), rightType, extraTypeInfo(right), resultType);
                }
                // for equality operations, compute what the result is with the alternative operator
                var altResult;
                switch (op) {
                    case "===":
                        altResult = left == right;
                        break;
                    case "!==":
                        altResult = left != right;
                        break;
                    case "==":
                        altResult = left === right;
                        break;
                    case "!=":
                        altResult = left !== right;
                        break;
                }
                if (altResult !== undefined) {
                    obs.alternativeResultValue = altResult;
                }
                addObservation(obs);
            }
            return result_c;
        };

        this.unaryPre = function(iid, op, left) {
        };

        this.unary = function(iid, op, left, result_c) {
            if (op !== "typeof") {
                var leftType = toTypeString(left);
                var resultType = toTypeString(resultType);
                var obs;
                if (leftType !== resultType) {
                    obs = new UnaryObservation(iid, isStrict(), op, leftType, extraTypeInfo(left), resultType,
                          toValueString(left), toValueString(result_c));
                } else {
                    obs = new UnaryObservation(iid, isStrict(), op, leftType, extraTypeInfo(left), resultType);
                }
                addObservation(obs);
            }
            return result_c;
        };

        this.conditionalPre = function(iid, left) {
        };

        this.conditional = function(iid, left, result_c) {
            var leftType = toTypeString(left);
            var obs;
            if (leftType !== "boolean") {
                var resultValue = "false";
                if (left)
                    resultValue = "true";
                obs = new UnaryObservation(iid, isStrict(), "conditional", leftType, extraTypeInfo(left), "boolean", toValueString(left), resultValue);
            } else {
                obs = new UnaryObservation(iid, isStrict(), "conditional", "boolean", 0, "boolean");
            }
            addObservation(obs);
            return left;
        };

        this.functionEnter = function(iid, fun, dis /* this */) {
            currentCallID = ++maxCallID;
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

        this.beginExecution = function(data) {
        };

        this.endExecution = function() {
            var results = {
                hashToObservations:hashToObservation,
                hashToFrequency:hashToFrequency,
                hashToCallIDs:hashToCallIDs,
                maxCallID:maxCallID
            };
            if (sandbox.Constants.isBrowser) {
                console.log("Sending results to jalangiFF");
                window.$jalangiFFLogResult(JSON.stringify(results, 0, 2), true);
            } else {
                var fs = require("fs");
                var benchmark = process.argv[1];
                var wrappedResults = [{url:benchmark, value:results}];
                var outFile = process.cwd() + "/analysisResults.json";
                console.log("Writing analysis results to " + outFile);
                fs.writeFileSync(outFile, JSON.stringify(wrappedResults, 0, 2));
            }
        };

        function importModule(moduleName) {
            if (sandbox.Constants.isBrowser) {
                return window['$' + moduleName];
            } else {
                return require('./' + moduleName + ".js");
            }
        }
    }

    sandbox.analysis = new TypeAnalysisEngine();
    if (sandbox.Constants.isBrowser) {
        //window.addEventListener("beforeunload", function() {
        //    console.log("beforeunload --> logging results");
        //    sandbox.analysis.endExecution();
        //}, false);

        //window.addEventListener("DOMContentLoaded", function() {
        //    var p = window.document.createElement("p");
        //    p.className = "jalangiFF-p";
        //    p.innerHTML = "jalangiFF running...";
        //    window.document.body.appendChild(p);
        //    p.addEventListener("click", function() {
        //        console.log("click on jalangiFF's p element --> logging results");
        //        sandbox.analysis.endExecution();
        //    }, false);
        //});
    }

}(J$));