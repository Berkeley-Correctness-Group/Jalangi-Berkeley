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

  function TypeAnalysisEngine(executionIndex) {

    // state
    var location2TypeHistogram = {}; // string --> (string --> number)

    // helper functions
    function addTypeObservation(locationId, type) {
      var typeHistogram = location2TypeHistogram[locationId] || {};
      var oldNb = typeHistogram[type] || 0;
      typeHistogram[type] = oldNb + 1;
      location2TypeHistogram[locationId] = typeHistogram;
    }

    function logResult() {
      var output = JSON.stringify(location2TypeHistogram);
      window.$jalangiFFLogResult(output, true);
      location2TypeHistogram = {};
    }

    function getInfoString(iid) {
      if (module.iids) {
        var arr = module.iids[iid];
        if (arr) {
          return "(" + arr[0] + ":" + arr[1] + ":" + arr[2] + ")";
        }
      }
      return iid + "";
    }

    // hooks
    this.declare = function(iid, name, val, isArgument) {
      var locationId = name + " declared at " + getInfoString(iid);
      var t = typeof val;
      addTypeObservation(locationId, t);
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
      var locationId = offset + " (field) written at " + getInfoString(iid);
      addTypeObservation(locationId, typeof val);
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
      var locationId = name + " (variable) written at " + getInfoString(iid);
      addTypeObservation(locationId, typeof val);
      return val;
    };

    this.binaryPre = function(iid, op, left, right) {
    };

    this.binary = function(iid, op, left, right, result_c) {
      var locationIdLeft = "left of " + op + " at " + getInfoString(iid);
      addTypeObservation(locationIdLeft, typeof left);
      var locationIdRight = "right of " + op + " at " + getInfoString(iid);
      addTypeObservation(locationIdRight, typeof right);

      return result_c;
    };

    this.unaryPre = function(iid, op, left) {
    };

    this.unary = function(iid, op, left, result_c) {
      var locationId = "operator of " + op + " at " + getInfoString(iid);
      addTypeObservation(locationId, typeof left);

      return result_c;
    };

    this.conditionalPre = function(iid, left) {
    };

    this.conditional = function(iid, left, result_c) {
      var locationId = "conditional at " + getInfoString(iid);
      addTypeObservation(locationId, typeof left);

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

  module.analysis = new TypeAnalysisEngine();
}(J$));