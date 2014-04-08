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

// Author: Michael Pradel

(function(module) {

  function ExecutionCountersEngine(executionIndex) {

    // state
    var callCtr = 0;
    var condCtr = 0;

    // helper functions
    function Counters(callCtr, condCtr) {
        this.callCtr = callCtr;
        this.condCtr = condCtr;
    }
    
    function logResult() {
        var result = new Counters(callCtr, condCtr);
        window.$jalangiFFLogResult(JSON.stringify(result), true);
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
        callCtr++;
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
      return result_c;
    };

    this.unaryPre = function(iid, op, left) {
    };

    this.unary = function(iid, op, left, result_c) {
      return result_c;
    };

    this.conditionalPre = function(iid, left) {
        condCtr++;
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

  module.analysis = new ExecutionCountersEngine();
}(J$));