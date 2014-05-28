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

    function ExecutionCountersEngine(executionIndex) {

        // state
        var callCtr = 0;
        var condCtr = 0;
        var executedLines = {};

        var iidToLocation = sandbox.iidToLocation;

        // helper functions
        function Counters(callCtr, condCtr, executedLines) {
            this.callCtr = callCtr;
            this.condCtr = condCtr;
            this.nbExecutedLines = Object.keys(executedLines).length;
        }

        function addToExecLines(iid) {
            var loc = iidToLocation(iid);
            if (loc) {
                var line = loc.split(":")[1];
                executedLines[line] = true;
            }
        }

        // hooks
        this.declare = function(iid, name, val, isArgument) {
            addToExecLines(iid);
        };

        this.literalPre = function(iid, val) {
        };

        this.literal = function(iid, val) {
            addToExecLines(iid);
            return val;
        };

        this.invokeFunPre = function(iid, f, base, args, isConstructor) {
            callCtr++;
        };

        this.invokeFun = function(iid, f, base, args, val, isConstructor) {
            addToExecLines(iid);
            return val;
        };

        this.getFieldPre = function(iid, base, offset) {
        };

        this.getField = function(iid, base, offset, val) {
            addToExecLines(iid);
            return val;
        };

        this.putFieldPre = function(iid, base, offset, val) {
            return val;
        };

        this.putField = function(iid, base, offset, val) {
            addToExecLines(iid);
            return val;
        };

        this.readPre = function(iid, name, val, isGlobal) {
        };

        this.read = function(iid, name, val, isGlobal) {
            addToExecLines(iid);
            return val;
        };

        this.writePre = function(iid, name, val, oldValue) {
        };

        this.write = function(iid, name, val, oldValue) {
            addToExecLines(iid);
            return val;
        };

        this.binaryPre = function(iid, op, left, right) {
        };

        this.binary = function(iid, op, left, right, result_c) {
            addToExecLines(iid);
            return result_c;
        };

        this.unaryPre = function(iid, op, left) {
        };

        this.unary = function(iid, op, left, result_c) {
            addToExecLines(iid);
            return result_c;
        };

        this.conditionalPre = function(iid, left) {
            condCtr++;
        };

        this.conditional = function(iid, left, result_c) {
            addToExecLines(iid);
            return left;
        };

        this.beginExecution = function(data) {
        };

        this.functionEnter = function(iid, fun, dis /* this */) {
        };

        this.functionExit = function(iid) {
            addToExecLines(iid);
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

        this.endExecution = function() {
            var result = new Counters(callCtr, condCtr, executedLines);
            if (sandbox.Constants.isBrowser) {
                window.$jalangiFFLogResult(JSON.stringify(result), true);
            } else {
                console.log(result);
            }
        };

    }

    sandbox.analysis = new ExecutionCountersEngine();
    if (sandbox.Constants.isBrowser) {
        window.addEventListener("beforeunload", function() {
            console.log("beforeunload --> logging results");
            sandbox.analysis.endExecution();
        }, false);
    }

}(J$));