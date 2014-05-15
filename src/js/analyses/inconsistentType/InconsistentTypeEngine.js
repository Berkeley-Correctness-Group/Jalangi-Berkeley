/*
 * Copyright 2013-2014 Samsung Information Systems America, Inc.
 *                2014 University of California, Berkeley
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

// Author: Koushik Sen, Michael Pradel

(function(sandbox) {

    function InconsistentTypeEngine() {
        var smemory = sandbox.smemory;
        var iidToLocation = sandbox.iidToLocation;
        var typeAnalysis = importModule("TypeAnalysis");
        var util = importModule("CommonUtil");
        var argPrefix = "__";
        var online = true;
        var printWarnings = true;
        var visualizeAllTypes = false; // only for node.js execution (i.e., not in browser)
        var visualizeWarningTypes = true; // only for node.js execution (i.e., not in browser)
        

        // type/function name could be object(iid) | array(iid) | function(iid) | object(null) | object | function | number | string | undefined | boolean
        var typeNameToFieldTypes = {}; // type or function name -> (field or this/return/argx -> type name -> iid -> true)  --  for each type/function, gives the fields, their types, and where this field type has been observed
        var typeNames = {};

        annotateGlobalFrame();

        var getSymbolic = this.getSymbolic = function(obj) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj) {
                return sobj.shadow;
            } else {
                return undefined;
            }
        };

        /**
         * @param {object} map
         * @param {string} key
         * @returns {object} 
         */
        function getAndInit(map, key) {
            if (!util.HOP(map, key))
                return map[key] = {};
            else
                return map[key];
        }

        /**
         * @param {string} name
         * @param {function | object} obj
         */
        function addFunctionOrTypeName(name, obj) {
            if (name.indexOf("function") === 0) {
                typeNames[name] = obj.name ? obj.name : "";
            } else {
                typeNames[name] = obj.constructor ? obj.constructor.name : "";
            }
        }

        /**
         * @param {object} base
         * @param {string} offset
         * @param {object} value
         * @param {number} updateLocation (IID)
         * @param {string} typeNameOptional
         */
        function updateType(base, offset, value, updateLocation, typeNameOptional) {
            var typeName, tval, type, s;
            if (!typeNameOptional) {
                typeName = getSymbolic(base);
            } else {
                typeName = typeNameOptional;
            }
            if (typeName) {
                addFunctionOrTypeName(typeName, base);
                tval = getAndInit(typeNameToFieldTypes, typeName);
                type = typeof value;
                s = getSymbolic(value);
                if (s) {
                    type = s;
                } else if (value === null) {
                    type = "object(null)";
                }
                if (typeName.indexOf("array") === 0) {
                    if (offset > 10) {
                        offset = 100000;
                    }
                }
                var tmap = getAndInit(tval, offset);
                var locations = getAndInit(tmap, type);
                locations[updateLocation] = true;
            }
        }

        /**
         * Attach shadow with type name to object.
         * @param {number} creationLocation
         * @param {object} obj
         * @param {string} optionalTypeName
         * @returns {object} The given object
         */
        function annotateObject(creationLocation, obj, optionalTypeName) {
            var type, i, s, sobj;

            var sobj = smemory.getShadowObject(obj);

            if (sobj) {
                if (sobj.shadow === undefined) {
                    type = typeof obj;
                    if ((type === "object" || type === "function") && obj !== null && obj.name !== "eval") {
                        if (Array.isArray(obj)) {
                            type = "array";
                        }
                        if (optionalTypeName) {
                            type = optionalTypeName;
                        }
                        s = type + "(" + creationLocation + ")";
                        sobj.shadow = s;
                        addFunctionOrTypeName(s, obj);
                        getAndInit(typeNameToFieldTypes, s);
                        for (i in obj) {
                            if (util.HOP(obj, i)) {
                                updateType(obj, i, obj[i], creationLocation, s);
                            }
                        }
                    }
                }
            }
            return obj;
        }

        function annotateGlobalFrame() {
            var f = smemory.getCurrentFrame();
            while (smemory.getParentFrame(f) !== undefined) {
                f = smemory.getParentFrame(f);
            }
            annotateObject(undefined, f, "global scope");
        }

        function setTypeInFunSignature(value, tval, offset, callLocation) {
            var type, typeName;
            type = typeof value;
            typeName = getSymbolic(value);
            if (typeName) {
                type = typeName;
            } else if (value === null) {
                type = "object(null)";
            }
            var tmap = getAndInit(tval, offset);
            var locations = getAndInit(tmap, type);
            locations[callLocation] = true;
        }

        /**
         * @param {function} f
         * @param {object} base
         * @param {array} args
         * @param {type} returnValue
         * @param {number} callLocation (IID)
         */
        function updateSignature(f, base, args, returnValue, callLocation) {
            var functionName, tval;
            functionName = getSymbolic(f);
            if (functionName) {
                addFunctionOrTypeName(functionName, f);
                tval = getAndInit(typeNameToFieldTypes, functionName);
                setTypeInFunSignature(returnValue, tval, "return", callLocation);
                setTypeInFunSignature(base, tval, "this", callLocation);
                var len = args.length;
                for (var i = 0; i < len; ++i) {
                    setTypeInFunSignature(args[i], tval, argPrefix+"arg" + (i + 1), callLocation);
                }
            }
        }

        function logResults() {
            var results = {
                typeNameToFieldTypes:typeNameToFieldTypes,
                typeNames:typeNames
            };
            if (sandbox.Constants.isBrowser) {
                console.log("Sending results to jalangiFF");
                window.$jalangiFFLogResult(JSON.stringify(results), true);
            } else {
                var fs = require("fs");
                var benchmark = process.argv[1];
                var wrappedResults = [{url:benchmark, value:results}];
                var outFile = process.cwd() + "/analysisResults.json";
                console.log("Writing analysis results to "+outFile);
                fs.writeFileSync(outFile, JSON.stringify(wrappedResults));
            }
        }

        this.functionEnter = function(iid, fun, dis /* this */) {
            annotateObject(iid, smemory.getCurrentFrame(), "frame");
        };

        this.readPre = function(iid, name, val, isGlobal) {
            if (name !== "this") {
                updateType(smemory.getFrame(name), name, val, iid);
            }
        };

        this.writePre = function(iid, name, val, oldValue) {
            if (name !== "this") {
                updateType(smemory.getFrame(name), name, val, iid);
            }
        };

        this.literal = function(iid, val) {
            return annotateObject(iid, val);
        };

        this.putFieldPre = function(iid, base, offset, val) {
            updateType(base, offset, val, iid);
            return val;
        };

        this.invokeFun = function(iid, f, base, args, val, isConstructor) {
            var ret;
            if (isConstructor) {
                ret = annotateObject(iid, val);
            } else {
                ret = val;
            }
            updateSignature(f, base, args, ret, iid);
            return ret;
        };

        this.getField = function(iid, base, offset, val, isGlobal) {
            if (val !== undefined) {
                updateType(base, offset, val, iid);
            }
            //getConcrete(base)[getConcrete(offset)] = ret;
            return val;
        };

        this.endExecution = function() {
            if (online) {
                typeAnalysis.analyzeTypes(typeNameToFieldTypes, typeNames, iidToLocation, printWarnings, visualizeAllTypes, visualizeWarningTypes);
            } else {
                logResults();
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

    sandbox.analysis = new InconsistentTypeEngine();
    if (sandbox.Constants.isBrowser) {
        window.addEventListener("beforeunload", function() {
            console.log("beforeunload --> logging results");
            sandbox.analysis.endExecution();
        }, false);
        window.addEventListener('keydown', function(e) {
            // keyboard shortcut is Alt-Shift-D
            if (e.altKey && e.shiftKey && e.keyCode === 68) {
                sandbox.analysis.endExecution();
            }
        });
    }

}(typeof J$ === 'undefined' ? (J$ = {}) : J$));

