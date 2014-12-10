//// START OF JALANGI LIBS
//
///*
// * Copyright 2014 University of California, Berkeley.
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *		http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
//
//// Author: Michael Pradel
//
//window.JALANGI_MODE = 'inbrowser';
//window.USE_SMEMORY = true;
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//    var Constants = sandbox.Constants = {};
//
//    Constants.isBrowser = !(typeof exports !== 'undefined' && this.exports !== exports);
//
//    Constants.IN_MEMORY_TRACE = Constants.isBrowser && (window.__JALANGI_IN_MEMORY_TRACE__);
//
//    var APPLY = Constants.APPLY = Function.prototype.apply;
//    var CALL = Constants.CALL = Function.prototype.call;
//    APPLY.apply = APPLY;
//    APPLY.call = CALL;
//    CALL.apply = APPLY;
//    CALL.call = CALL;
//
//    var HAS_OWN_PROPERTY = Constants.HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;
//    Constants.HAS_OWN_PROPERTY_CALL = Object.prototype.hasOwnProperty.call;
//
//
//    var PREFIX1 = "J$";
//    Constants.SPECIAL_PROP = "*" + PREFIX1 + "*";
//    Constants.SPECIAL_PROP2 = "*" + PREFIX1 + "I*";
//    Constants.SPECIAL_PROP3 = "*" + PREFIX1 + "C*";
//    Constants.SPECIAL_PROP4 = "*" + PREFIX1 + "W*";
//
//    Constants.MODE_RECORD = 1;
//    Constants.MODE_REPLAY = 2;
//    Constants.MODE_NO_RR_IGNORE_UNINSTRUMENTED = 3;
//    Constants.MODE_NO_RR = 4;
//    Constants.MODE_DIRECT = 5;
//
//    Constants.T_NULL = 0;
//    Constants.T_NUMBER = 1;
//    Constants.T_BOOLEAN = 2;
//    var T_STRING = Constants.T_STRING = 3;
//    Constants.T_OBJECT = 4;
//    Constants.T_FUNCTION = 5;
//    Constants.T_UNDEFINED = 6;
//    Constants.T_ARRAY = 7;
//
//    var F_TYPE = Constants.F_TYPE = 0;
//    var F_VALUE = Constants.F_VALUE = 1;
//    Constants.F_IID = 2;
//    Constants.F_SEQ = 3;
//    Constants.F_FUNNAME = 4;
//
//    Constants.UNKNOWN = -1;
//
//    Constants.N_LOG_FUNCTION_ENTER = 4;
//    Constants.N_LOG_SCRIPT_ENTER = 6;
//    Constants.N_LOG_GETFIELD = 8;
//    Constants.N_LOG_ARRAY_LIT = 10;
//    Constants.N_LOG_OBJECT_LIT = 11;
//    Constants.N_LOG_FUNCTION_LIT = 12;
//    Constants.N_LOG_RETURN = 13;
//    Constants.N_LOG_REGEXP_LIT = 14;
//    Constants.N_LOG_READ = 17;
//    Constants.N_LOG_LOAD = 18;
//    Constants.N_LOG_HASH = 19;
//    Constants.N_LOG_SPECIAL = 20;
//    Constants.N_LOG_STRING_LIT = 21;
//    Constants.N_LOG_NUMBER_LIT = 22;
//    Constants.N_LOG_BOOLEAN_LIT = 23;
//    Constants.N_LOG_UNDEFINED_LIT = 24;
//    Constants.N_LOG_NULL_LIT = 25;
//    // property read *directly* from an object (not from the prototype chain)
//    Constants.N_LOG_GETFIELD_OWN = 26;
//    Constants.N_LOG_OPERATION = 27;
//
//    //-------------------------------- End constants ---------------------------------
//
//    //-------------------------------------- Constant functions -----------------------------------------------------------
//
//    Constants.getConcrete = function(val) {
//        if (sandbox.analysis && sandbox.analysis.getConcrete) {
//            return sandbox.analysis.getConcrete(val);
//        } else {
//            return val;
//        }
//    }
//
//    Constants.getSymbolic = function(val) {
//        if (sandbox.analysis && sandbox.analysis.getSymbolic) {
//            return sandbox.analysis.getSymbolic(val);
//        } else {
//            return val;
//        }
//    }
//
//    var HOP = Constants.HOP = function(obj, prop) {
//        return (prop + "" === '__proto__') || CALL.call(HAS_OWN_PROPERTY, obj, prop); //Constants.HAS_OWN_PROPERTY_CALL.apply(Constants.HAS_OWN_PROPERTY, [obj, prop]);
//    }
//
//    Constants.hasGetterSetter = function(obj, prop, isGetter) {
//        if (typeof Object.getOwnPropertyDescriptor !== 'function') {
//            return true;
//        }
//        while (obj !== null) {
//            if (typeof obj !== 'object' && typeof obj !== 'function') {
//                return false;
//            }
//            var desc = Object.getOwnPropertyDescriptor(obj, prop);
//            if (desc !== undefined) {
//                if (isGetter && typeof desc.get === 'function') {
//                    return true;
//                }
//                if (!isGetter && typeof desc.set === 'function') {
//                    return true;
//                }
//            } else if (HOP(obj, prop)) {
//                return false;
//            }
//            obj = obj.__proto__;
//        }
//        return false;
//    }
//
//    Constants.debugPrint = function(s) {
//        if (sandbox.Config.DEBUG) {
//            console.log("***" + s);
//        }
//    }
//
//    Constants.warnPrint = function(iid, s) {
//        if (sandbox.Config.WARN && iid !== 0) {
//            console.log("        at " + iid + " " + s);
//        }
//    }
//
//    Constants.seriousWarnPrint = function(iid, s) {
//        if (sandbox.Config.SERIOUS_WARN && iid !== 0) {
//            console.log("        at " + iid + " Serious " + s);
//        }
//    }
//
//    Constants.encodeNaNandInfForJSON = function(key, value) {
//        if (value === Infinity) {
//            return "Infinity";
//        } else if (value !== value) {
//            return "NaN";
//        }
//        return value;
//    }
//
//    Constants.decodeNaNandInfForJSON = function(key, value) {
//        if (value === "Infinity") {
//            return Infinity;
//        } else if (value === 'NaN') {
//            return NaN;
//        } else {
//            return value;
//        }
//    }
//
//    Constants.fixForStringNaN = function(record) {
//        if (record[F_TYPE] == T_STRING) {
//            if (record[F_VALUE] !== record[F_VALUE]) {
//                record[F_VALUE] = 'NaN';
//            } else if (record[F_VALUE] === Infinity) {
//                record[F_VALUE] = 'Infinity';
//            }
//
//        }
//    }
//
//})(J$);
//
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//    var Config = sandbox.Config = {};
//
//    Config.DEBUG = false;
//    Config.WARN = false;
//    Config.SERIOUS_WARN = false;
//    // make MAX_BUF_SIZE slightly less than 2^16, to allow over low-level overheads
//    Config.MAX_BUF_SIZE = 64000;
//    Config.LOG_ALL_READS_AND_BRANCHES = false;
//
//    //**********************************************************
//    //  Functions for selective instrumentation of operations
//    //**********************************************************
//    // In the following functions
//    // return true in a function, if you want the ast node (passed as the second argument) to be instrumented
//    // ast node gets instrumented if you do not define the corresponding function
//    //    Config.INSTR_READ = function(name, ast) { return false; };
//    //    Config.INSTR_WRITE = function(name, ast) { return true; };
//    //    Config.INSTR_GETFIELD = function(offset, ast) { return true; }; // offset is null if the property is computed
//    //    Config.INSTR_PUTFIELD = function(offset, ast) { return true; }; // offset is null if the property is computed
//    //    Config.INSTR_BINARY = function(operator, ast) { return true; };
//    //    Config.INSTR_PROPERTY_BINARY_ASSIGNMENT = function(operator, offset, ast) { return true; }; // a.x += e or a[e1] += e2
//    //    Config.INSTR_UNARY = function(operator, ast) { return true; };
//    //    Config.INSTR_LITERAL = function(literal, ast) { return true;}; // literal gets some dummy value if the type is object, function, or array
//    //    Config.INSTR_CONDITIONAL = function(type, ast) { return true; }; // type could be "&&", "||", "switch", "other"
//}(J$));
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//
//(function(sandbox) {
//    var Globals = sandbox.Globals = {};
//    Globals.mode;
//    Globals.isInstrumentedCaller;
//    Globals.isMethodCall;
//    Globals.isConstructorCall;
//    Globals.isBrowserReplay;
//    Globals.traceFileName;
//    Globals.traceWriter;
//    Globals.loadAndBranchLogs = [];
//
//}(J$));
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//
//
//    sandbox.TraceWriter = function() {
//        var Constants = sandbox.Constants;
//        var Globals = sandbox.Globals;
//        var Config = sandbox.Config;
//
//        var bufferSize = 0;
//        var buffer = [];
//        var traceWfh;
//        var fs = (!Constants.isBrowser) ? require('fs') : undefined;
//        var trying = false;
//        var cb;
//        var remoteBuffer = [];
//        var socket, isOpen = false;
//        // if true, in the process of doing final trace dump,
//        // so don't record any more events
//        var tracingDone = false;
//
//        if (Constants.IN_MEMORY_TRACE) {
//            // attach the buffer to the sandbox
//            sandbox.trace_output = buffer;
//        }
//
//        function getFileHanlde() {
//            if (traceWfh === undefined) {
//                traceWfh = fs.openSync(Globals.traceFileName, 'w');
//            }
//            return traceWfh;
//        }
//
//        /**
//         * @param {string} line
//         */
//        this.logToFile = function(line) {
//            if (tracingDone) {
//                // do nothing
//                return;
//            }
//            var len = line.length;
//            // we need this loop because it's possible that len >= Config.MAX_BUF_SIZE
//            // TODO fast path for case where len < Config.MAX_BUF_SIZE?
//            var start = 0,
//                end = len < Config.MAX_BUF_SIZE ? len : Config.MAX_BUF_SIZE;
//            while (start < len) {
//                var chunk = line.substring(start, end);
//                var curLen = end - start;
//                if (bufferSize + curLen > Config.MAX_BUF_SIZE) {
//                    this.flush();
//                }
//                buffer.push(chunk);
//                bufferSize += curLen;
//                start = end;
//                end = (end + Config.MAX_BUF_SIZE < len) ? end + Config.MAX_BUF_SIZE : len;
//            }
//        };
//
//        this.flush = function() {
//            if (Constants.IN_MEMORY_TRACE) {
//                // no need to flush anything
//                return;
//            }
//            var msg;
//            if (!Constants.isBrowser) {
//                var length = buffer.length;
//                for (var i = 0; i < length; i++) {
//                    fs.writeSync(getFileHanlde(), buffer[i]);
//                }
//            } else {
//                msg = buffer.join('');
//                if (msg.length > 1) {
//                    this.remoteLog(msg);
//                }
//            }
//            bufferSize = 0;
//            buffer = [];
//        };
//
//
//        function openSocketIfNotOpen() {
//            if (!socket) {
//                console.log("Opening connection");
//                socket = new WebSocket('ws://127.0.0.1:8080', 'log-protocol');
//                socket.onopen = tryRemoteLog;
//                socket.onmessage = tryRemoteLog2;
//            }
//        }
//
//        /**
//         * invoked when we receive a message over the websocket,
//         * indicating that the last trace chunk in the remoteBuffer
//         * has been received
//         */
//        function tryRemoteLog2() {
//            trying = false;
//            remoteBuffer.shift();
//            if (remoteBuffer.length === 0) {
//                if (cb) {
//                    cb();
//                    cb = undefined;
//                }
//            }
//            tryRemoteLog();
//        }
//
//        this.onflush = function(callback) {
//            if (remoteBuffer.length === 0) {
//                if (callback) {
//                    callback();
//                }
//            } else {
//                cb = callback;
//                tryRemoteLog();
//            }
//        };
//
//        function tryRemoteLog() {
//            isOpen = true;
//            if (!trying && remoteBuffer.length > 0) {
//                trying = true;
//                socket.send(remoteBuffer[0]);
//            }
//        }
//
//        this.remoteLog = function(message) {
//            if (message.length > Config.MAX_BUF_SIZE) {
//                throw new Error("message too big!!!");
//            }
//            remoteBuffer.push(message);
//            openSocketIfNotOpen();
//            if (isOpen) {
//                tryRemoteLog();
//            }
//        };
//
//        /**
//         * stop recording the trace and flush everything
//         */
//        this.stopTracing = function() {
//            tracingDone = true;
//            if (!Constants.IN_MEMORY_TRACE) {
//                this.flush();
//            }
//        };
//    }
//
//})(J$);
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//
//    sandbox.TraceReader = function() {
//        var Constants = sandbox.Constants;
//        var Globals = sandbox.Globals;
//        var Config = sandbox.Config;
//
//        var F_SEQ = Constants.F_SEQ;
//        var F_TYPE = Constants.F_TYPE;
//        var F_VALUE = Constants.F_VALUE;
//        var F_IID = Constants.F_IID;
//        var F_FUNNAME = Constants.F_FUNNAME;
//        var N_LOG_LOAD = Constants.N_LOG_LOAD;
//        var N_LOG_HASH = Constants.N_LOG_HASH;
//
//        var T_OBJECT = Constants.T_OBJECT;
//        var T_FUNCTION = Constants.T_FUNCTION;
//        var T_ARRAY = Constants.T_ARRAY;
//
//
//        var decodeNaNandInfForJSON = Constants.decodeNaNandInfForJSON;
//        var fixForStringNaN = Constants.fixForStringNaN;
//        var debugPrint = Constants.debugPrint;
//
//        var traceArray = [];
//        this.traceIndex = 0;
//        var currentIndex = 0;
//        var frontierIndex = 0;
//        var MAX_SIZE = 1024;
//        var traceFh;
//        var done = false;
//        var curRecord = null;
//
//        var count = 0;
//        var count2 = 0;
//
//        this.objectIdLife = [];
//
//        this.populateObjectIdLife = function() {
//            if (Constants.isBrowserReplay) {
//                return;
//            }
//            var type;
//            var FileLineReader = require('./utils/FileLineReader');
//            var traceFh = new FileLineReader(Globals.traceFileName);
//            while (traceFh.hasNextLine()) {
//                var record = JSON.parse(traceFh.nextLine(), decodeNaNandInfForJSON);
//                if (((type = record[F_TYPE]) === T_OBJECT || type === T_ARRAY || type === T_FUNCTION) && record[F_FUNNAME] !== N_LOG_HASH && record[F_VALUE] !== Constants.UNKNOWN) {
//                    this.objectIdLife[record[F_VALUE]] = record[F_SEQ];
//                }
//                if (record[F_FUNNAME] === N_LOG_LOAD && record[F_VALUE] !== Constants.UNKNOWN) {
//                    this.objectIdLife[record[F_VALUE]] = record[F_SEQ];
//                }
//            }
//            traceFh.close();
//        };
//
//        this.hasFutureReference = function(id) {
//            var ret = (this.objectIdLife[id] >= this.traceIndex);
//            return ret;
//        };
//
//        this.canDeleteReference = function(recordedArray) {
//            var ret = (this.objectIdLife[recordedArray[F_VALUE]] === recordedArray[F_SEQ]);
//            return ret;
//        };
//
//        function cacheRecords() {
//            var i = 0,
//                flag, record;
//
//            if (Constants.isBrowserReplay) {
//                return;
//            }
//            if (currentIndex >= frontierIndex) {
//                if (!traceFh) {
//                    var FileLineReader = require('./utils/FileLineReader');
//                    traceFh = new FileLineReader(Globals.traceFileName);
//                    // change working directory to wherever trace file resides
//                    var pth = require('path');
//                    var traceFileDir = pth.dirname(pth.resolve(process.cwd(), Globals.traceFileName));
//                    process.chdir(traceFileDir);
//                }
//                traceArray = [];
//                while (!done && (flag = traceFh.hasNextLine()) && i < MAX_SIZE) {
//                    record = JSON.parse(traceFh.nextLine(), decodeNaNandInfForJSON);
//                    fixForStringNaN(record);
//                    traceArray.push(record);
//                    debugPrint(i + ":" + JSON.stringify(record /*, encodeNaNandInfForJSON*/ ));
//                    frontierIndex++;
//                    i++;
//                }
//                if (!flag && !done) {
//                    traceFh.close();
//                    done = true;
//                }
//            }
//        }
//
//        this.addRecord = function(line) {
//            var record = JSON.parse(line, decodeNaNandInfForJSON);
//            fixForStringNaN(record);
//            traceArray.push(record);
//            debugPrint(JSON.stringify(record /*, encodeNaNandInfForJSON*/ ));
//            frontierIndex++;
//        };
//
//        this.getAndNext = function() {
//            if (curRecord !== null) {
//                var ret = curRecord;
//                curRecord = null;
//                return ret;
//            }
//            cacheRecords();
//            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
//            var record = traceArray[j];
//            if (record && record[F_SEQ] === this.traceIndex) {
//                currentIndex++;
//            } else {
//                record = undefined;
//            }
//            this.traceIndex++;
//            return record;
//        };
//
//        this.getNext = function() {
//            if (curRecord !== null) {
//                throw new Error("Cannot do two getNext() in succession");
//            }
//            var tmp = this.getAndNext();
//            var ret = this.getCurrent();
//            curRecord = tmp;
//            return ret;
//        };
//
//        this.getCurrent = function() {
//            if (curRecord !== null) {
//                return curRecord;
//            }
//            cacheRecords();
//            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
//            var record = traceArray[j];
//            if (!(record && record[F_SEQ] === this.traceIndex)) {
//                record = undefined;
//            }
//            return record;
//        };
//
//        this.next = function() {
//            if (curRecord !== null) {
//                curRecord = null;
//                return;
//            }
//            cacheRecords();
//            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
//            var record = traceArray[j];
//            if (record && record[F_SEQ] === this.traceIndex) {
//                currentIndex++;
//            }
//            this.traceIndex++;
//        };
//
//        this.getPreviousIndex = function() {
//            if (curRecord !== null) {
//                return this.traceIndex - 2;
//            }
//            return this.traceIndex - 1;
//        };
//
//
//    };
//
//})(J$);
////----------------------------------- Record Replay Engine ---------------------------------
//
//// create / reset J$ global variable to hold analysis runtime
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//    sandbox.SMemory = function() {
//        var Constants = sandbox.Constants;
//
//        var SPECIAL_PROP = Constants.SPECIAL_PROP + "M";
//        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2 + "M";
//        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3 + "M";
//        var N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT;
//        var objectId = 1;
//        var frameId = 2;
//        var scriptCount = 0;
//        var HOP = Constants.HOP;
//
//
//        var frame = Object.create(null);
//        //frame[SPECIAL_PROP] = frameId;
//        //frameId = frameId + 2;
//
//        var frameStack = [frame];
//        var evalFrames = [];
//
//
//        function createShadowObject(val) {
//            var type = typeof val;
//            if ((type === 'object' || type === 'function') && val !== null && !HOP(val, SPECIAL_PROP)) {
//                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                    Object.defineProperty(val, SPECIAL_PROP, {
//                        enumerable: false,
//                        writable: true
//                    });
//                }
//                try {
//                    val[SPECIAL_PROP] = Object.create(null);
//                    val[SPECIAL_PROP][SPECIAL_PROP] = objectId;
//                    objectId = objectId + 2;
//                } catch (e) {
//                    // cannot attach special field in some DOM Objects.  So ignore them.
//                }
//            }
//
//        }
//
//        this.getShadowObject = function(val) {
//            var value;
//            createShadowObject(val);
//            var type = typeof val;
//            if ((type === 'object' || type === 'function') && val !== null && HOP(val, SPECIAL_PROP)) {
//                value = val[SPECIAL_PROP];
//            } else {
//                value = undefined;
//            }
//            return value;
//        };
//
//        this.getFrame = function(name) {
//            var tmp = frame;
//            while (tmp && !HOP(tmp, name)) {
//                tmp = tmp[SPECIAL_PROP3];
//            }
//            if (tmp) {
//                return tmp;
//            } else {
//                return frameStack[0]; // return global scope
//            }
//        };
//
//        this.getParentFrame = function(otherFrame) {
//            if (otherFrame) {
//                return otherFrame[SPECIAL_PROP3];
//            } else {
//                return null;
//            }
//        };
//
//        this.getCurrentFrame = function() {
//            return frame;
//        };
//
//        this.getClosureFrame = function(fun) {
//            return fun[SPECIAL_PROP3];
//        };
//
//        this.getShadowObjectID = function(obj) {
//            return obj[SPECIAL_PROP];
//        };
//
//        this.defineFunction = function(val, type) {
//            if (type === N_LOG_FUNCTION_LIT) {
//                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                    Object.defineProperty(val, SPECIAL_PROP3, {
//                        enumerable: false,
//                        writable: true
//                    });
//                }
//                val[SPECIAL_PROP3] = frame;
//            }
//        };
//
//        this.evalBegin = function() {
//            evalFrames.push(frame);
//            frame = frameStack[0];
//        };
//
//        this.evalEnd = function() {
//            frame = evalFrames.pop();
//        };
//
//
//        this.initialize = function(name) {
//            frame[name] = undefined;
//        };
//
//        this.functionEnter = function(val) {
//            frameStack.push(frame = Object.create(null));
//            if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                Object.defineProperty(frame, SPECIAL_PROP3, {
//                    enumerable: false,
//                    writable: true
//                });
//            }
//            frame[SPECIAL_PROP3] = val[SPECIAL_PROP3];
//        };
//
//        this.functionReturn = function() {
//            frameStack.pop();
//            frame = frameStack[frameStack.length - 1];
//        };
//
//        this.scriptEnter = function() {
//            scriptCount++;
//            if (scriptCount > 1) {
//                frameStack.push(frame = Object.create(null));
//                //frame[SPECIAL_PROP] = frameId;
//                //frameId = frameId + 2;
//                frame[SPECIAL_PROP3] = frameStack[0];
//            }
//        };
//
//        this.scriptReturn = function() {
//            if (scriptCount > 1) {
//                frameStack.pop();
//                frame = frameStack[frameStack.length - 1];
//            }
//            scriptCount--;
//        };
//
//    };
//
//}(J$));
//
//
///*
// * Copyright 2013-2014 Samsung Information Systems America, Inc.
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *        http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
//
//// Author: Koushik Sen
//
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//    var Constants = sandbox.Constants;
//    var isBrowser = Constants ? Constants.isBrowser : undefined;
//    var isInit = false;
//
//    sandbox.iidToLocation = function(iid) {
//        var ret;
//        if (!isInit) {
//            isInit = true;
//            if (!isBrowser) {
//                try {
//                    require(process.cwd() + "/jalangi_sourcemap");
//                } catch (e) {
//                    // don't crash if we can't find sourcemap file
//                }
//            }
//        }
//        if (sandbox.iids) {
//            if ((ret = sandbox.iids[iid])) {
//
//                return "(" + ret[0] /*.replace("_orig_.js", ".js")*/ + ":" + ret[1] + ":" + ret[2] + ":" + ret[3] + ":" + ret[4] + ")";
//            }
//        }
//        return iid + "";
//    };
//
//}(J$));
////----------------------------------- Record Replay Engine ---------------------------------
//
//// create / reset J$ global variable to hold analysis runtime
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//(function(sandbox) {
//
//    //----------------------------------- Record Replay Engine ---------------------------------
//
//    sandbox.RecordReplayEngine = function() {
//
//        // get the constants in local variables for faster access
//
//        var Constants = sandbox.Constants;
//        var Globals = sandbox.Globals;
//        var Config = sandbox.Config;
//        var TraceWriter = sandbox.TraceWriter;
//        var TraceReader = sandbox.TraceReader;
//
//        var SPECIAL_PROP = Constants.SPECIAL_PROP;
//        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2;
//        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3;
//        var SPECIAL_PROP4 = Constants.SPECIAL_PROP4;
//
//
//        var MODE_RECORD = Constants.MODE_RECORD,
//            MODE_REPLAY = Constants.MODE_REPLAY;
//
//        var T_NULL = Constants.T_NULL,
//            T_NUMBER = Constants.T_NUMBER,
//            T_BOOLEAN = Constants.T_BOOLEAN,
//            T_STRING = Constants.T_STRING,
//            T_OBJECT = Constants.T_OBJECT,
//            T_FUNCTION = Constants.T_FUNCTION,
//            T_UNDEFINED = Constants.T_UNDEFINED,
//            T_ARRAY = Constants.T_ARRAY;
//
//        var F_TYPE = Constants.F_TYPE,
//            F_VALUE = Constants.F_VALUE,
//            F_IID = Constants.F_IID,
//            F_SEQ = Constants.F_SEQ,
//            F_FUNNAME = Constants.F_FUNNAME;
//
//        var N_LOG_FUNCTION_ENTER = Constants.N_LOG_FUNCTION_ENTER,
//            N_LOG_SCRIPT_ENTER = Constants.N_LOG_SCRIPT_ENTER,
//            N_LOG_GETFIELD = Constants.N_LOG_GETFIELD,
//            N_LOG_ARRAY_LIT = Constants.N_LOG_ARRAY_LIT,
//            N_LOG_OBJECT_LIT = Constants.N_LOG_OBJECT_LIT,
//            N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT,
//            N_LOG_RETURN = Constants.N_LOG_RETURN,
//            N_LOG_REGEXP_LIT = Constants.N_LOG_REGEXP_LIT,
//            N_LOG_READ = Constants.N_LOG_READ,
//            N_LOG_LOAD = Constants.N_LOG_LOAD,
//            N_LOG_HASH = Constants.N_LOG_HASH,
//            N_LOG_SPECIAL = Constants.N_LOG_SPECIAL,
//            N_LOG_GETFIELD_OWN = Constants.N_LOG_GETFIELD_OWN;
//
//        var HOP = Constants.HOP;
//        var hasGetterSetter = Constants.hasGetterSetter;
//        var getConcrete = Constants.getConcrete;
//        var debugPrint = Constants.debugPrint;
//        var warnPrint = Constants.warnPrint;
//        var seriousWarnPrint = Constants.seriousWarnPrint;
//        var encodeNaNandInfForJSON = Constants.encodeNaNandInfForJSON;
//
//        var traceReader, traceWriter;
//        var seqNo = 0;
//
//        var frame = {
//            "this": undefined
//        };
//        var frameStack = [frame];
//
//        var evalFrames = [];
//
//        var literalId = 2;
//
//        var objectId = 1;
//        var objectMap = [];
//        var createdMockObject = false;
//        /*
//         type enumerations are
//         null is 0
//         number is 1
//         boolean is 2
//         string is 3
//         object is 4
//         function is 5
//         undefined is 6
//         array is 7
//         */
//
//
//        function load(path) {
//            var head, script;
//            head = document.getElementsByTagName('head')[0];
//            script = document.createElement('script');
//            script.type = 'text/javascript';
//            script.src = path;
//            head.appendChild(script);
//        }
//
//
//        function printableValue(val) {
//            var value, typen = getNumericType(val),
//                ret = [];
//            if (typen === T_NUMBER || typen === T_BOOLEAN || typen === T_STRING) {
//                value = val;
//            } else if (typen === T_UNDEFINED) {
//                value = 0;
//            } else {
//                if (val === null) {
//                    value = 0;
//                } else {
//                    try {
//                        if (!HOP(val, SPECIAL_PROP)) {
//                            createdMockObject = true;
//                            if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                                try {
//                                    Object.defineProperty(val, SPECIAL_PROP, {
//                                        enumerable: false,
//                                        writable: true
//                                    });
//                                } catch (e) {
//                                    if (Constants.isBrowser && window.__JALANGI_PHANTOM__) {
//                                        // known issue with older WebKit in PhantomJS
//                                        // ignoring seems to not cause anything too harmful
//                                    } else {
//                                        throw e;
//                                    }
//                                }
//                            }
//                            if (typen === T_ARRAY) {
//                                val[SPECIAL_PROP] = []; //Object.create(null);
//                            } else {
//                                val[SPECIAL_PROP] = {}; //Object.create(null);
//                            }
//                            val[SPECIAL_PROP][SPECIAL_PROP] = objectId;
//                            //                            console.log("oid:"+objectId);
//                            objectId = objectId + 2;
//                        }
//                    } catch (e2) {
//
//                    }
//                    if (HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP] && typeof val[SPECIAL_PROP][SPECIAL_PROP] === 'number') {
//                        value = val[SPECIAL_PROP][SPECIAL_PROP];
//                    } else {
//                        value = Constants.UNKNOWN;
//                    }
//                }
//            }
//            ret[F_TYPE] = typen;
//            ret[F_VALUE] = value;
//            return ret;
//        }
//
//        function getNumericType(val) {
//            var type = typeof val;
//            var typen;
//            switch (type) {
//                case "number":
//                    typen = T_NUMBER;
//                    break;
//                case "boolean":
//                    typen = T_BOOLEAN;
//                    break;
//                case "string":
//                    typen = T_STRING;
//                    break;
//                case "object":
//                    if (val === null) {
//                        typen = T_NULL;
//                    } else if (Array.isArray(val)) {
//                        typen = T_ARRAY;
//                    } else {
//                        typen = T_OBJECT;
//                    }
//                    break;
//                case "function":
//                    typen = T_FUNCTION;
//                    break;
//                case "undefined":
//                    typen = T_UNDEFINED;
//                    break;
//            }
//            return typen;
//        }
//
//
//        function setLiteralId(val, HasGetterSetter) {
//            var id;
//            var oldVal = val;
//            val = getConcrete(oldVal);
//            if (!HOP(val, SPECIAL_PROP) || !val[SPECIAL_PROP]) {
//                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                    Object.defineProperty(val, SPECIAL_PROP, {
//                        enumerable: false,
//                        writable: true
//                    });
//                }
//                if (Array.isArray(val))
//                    val[SPECIAL_PROP] = [];
//                else
//                    val[SPECIAL_PROP] = {};
//                val[SPECIAL_PROP][SPECIAL_PROP] = id = literalId;
//                literalId = literalId + 2;
//                // changes due to getter or setter method
//                for (var offset in val) {
//                    if (offset !== SPECIAL_PROP && offset !== SPECIAL_PROP2 && HOP(val, offset)) {
//                        if (!HasGetterSetter || !hasGetterSetter(val, offset, true))
//                            val[SPECIAL_PROP][offset] = val[offset];
//                    }
//                }
//            }
//            if (Globals.mode === MODE_REPLAY) {
//                if (traceReader.hasFutureReference(id))
//                    objectMap[id] = oldVal;
//                val[SPECIAL_PROP][SPECIAL_PROP4] = oldVal;
//            }
//        }
//
//        function getActualValue(recordedValue, recordedType) {
//            if (recordedType === T_UNDEFINED) {
//                return undefined;
//            } else if (recordedType === T_NULL) {
//                return null;
//            } else {
//                return recordedValue;
//            }
//        }
//
//
//        function syncValue(recordedArray, replayValue, iid) {
//            var oldReplayValue = replayValue,
//                tmp;
//
//            replayValue = getConcrete(replayValue);
//            var recordedValue = recordedArray[F_VALUE],
//                recordedType = recordedArray[F_TYPE];
//
//            if (recordedType === T_UNDEFINED ||
//                recordedType === T_NULL ||
//                recordedType === T_NUMBER ||
//                recordedType === T_STRING ||
//                recordedType === T_BOOLEAN) {
//                if ((tmp = getActualValue(recordedValue, recordedType)) !== replayValue) {
//                    return tmp;
//                } else {
//                    return oldReplayValue;
//                }
//            } else {
//                //var id = objectMapIndex[recordedValue];
//                var obj = objectMap[recordedValue];
//                var type = getNumericType(replayValue);
//
//                if (obj === undefined) {
//                    if (type === recordedType && !(HOP(replayValue, SPECIAL_PROP) && replayValue[SPECIAL_PROP])) {
//                        obj = replayValue;
//                    } else {
//                        if (recordedType === T_OBJECT) {
//                            obj = {};
//                        } else if (recordedType === T_ARRAY) {
//                            obj = [];
//                        } else {
//                            obj = function() {};
//                        }
//                    }
//                    try {
//                        if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                            Object.defineProperty(obj, SPECIAL_PROP, {
//                                enumerable: false,
//                                writable: true
//                            });
//                        }
//                    } catch (ex) {
//
//                    }
//                    obj[SPECIAL_PROP] = {}; //Object.create(null);
//                    obj[SPECIAL_PROP][SPECIAL_PROP] = recordedValue;
//                    createdMockObject = true;
//                    var tmp2 = ((obj === replayValue) ? oldReplayValue : obj);
//                    if (recordedValue !== Constants.UNKNOWN && traceReader.hasFutureReference(recordedValue))
//                        objectMap[recordedValue] = tmp2;
//                    obj[SPECIAL_PROP][SPECIAL_PROP4] = tmp2;
//                } else if (traceReader.canDeleteReference(recordedArray)) {
//                    objectMap[recordedValue] = undefined;
//                }
//
//                return (obj === replayValue) ? oldReplayValue : obj;
//            }
//        }
//
//
//        function logValue(iid, ret, funName) {
//            ret[F_IID] = iid;
//            ret[F_FUNNAME] = funName;
//            ret[F_SEQ] = seqNo++;
//            var line = JSON.stringify(ret, encodeNaNandInfForJSON) + "\n";
//            traceWriter.logToFile(line);
//        }
//
//        function checkPath(ret, iid, fun) {
//            if (ret === undefined || ret[F_IID] !== iid) {
//                if (fun === N_LOG_RETURN) {
//                    throw undefined; // a native function call has thrown an exception
//                } else {
//                    if (Config.LOG_ALL_READS_AND_BRANCHES) {
//                        console.log()
//                        require('fs').writeFileSync("readAndBranchLogs.replay", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
//                    }
//                    seriousWarnPrint(iid, "Path deviation at record = [" + ret + "] iid = " + iid + " index = " + traceReader.getPreviousIndex());
//                    throw new Error("Path deviation at record = [" + ret + "] iid = " + iid + " index = " + traceReader.getPreviousIndex());
//                }
//            }
//        }
//
//        function getFrameContainingVar(name) {
//            var tmp = frame;
//            while (tmp && !HOP(tmp, name)) {
//                tmp = tmp[SPECIAL_PROP3];
//            }
//            if (tmp) {
//                return tmp;
//            } else {
//                return frameStack[0]; // return global scope
//            }
//        }
//
//        this.record = function(prefix) {
//            var ret = [];
//            ret[F_TYPE] = getNumericType(prefix);
//            ret[F_VALUE] = prefix;
//            logValue(0, ret, N_LOG_SPECIAL);
//        };
//
//
//        this.command = function(rec) {
//            traceWriter.remoteLog(rec);
//        };
//
//        this.RR_getConcolicValue = function(obj) {
//            var val = getConcrete(obj);
//            if (val === obj && val !== undefined && val !== null && HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP]) {
//                var val = val[SPECIAL_PROP][SPECIAL_PROP4];
//                if (val !== undefined) {
//                    return val;
//                } else {
//                    return obj;
//                }
//            } else {
//                return obj;
//            }
//        };
//
//        this.RR_updateRecordedObject = function(obj) {
//            if (Globals.mode === MODE_REPLAY) {
//                var val = getConcrete(obj);
//                if (val !== obj && val !== undefined && val !== null && HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP]) {
//                    var id = val[SPECIAL_PROP][SPECIAL_PROP];
//                    if (traceReader.hasFutureReference(id))
//                        objectMap[id] = obj;
//                    val[SPECIAL_PROP][SPECIAL_PROP4] = obj;
//                }
//            }
//        };
//
//
//        this.RR_evalBegin = function() {
//            evalFrames.push(frame);
//            frame = frameStack[0];
//        };
//
//        this.RR_evalEnd = function() {
//            frame = evalFrames.pop();
//        };
//
//
//        this.syncPrototypeChain = function(iid, obj) {
//            var proto;
//
//            obj = getConcrete(obj);
//            proto = obj.__proto__;
//            var oid = this.RR_Load(iid, (proto && HOP(proto, SPECIAL_PROP) && proto[SPECIAL_PROP]) ? proto[SPECIAL_PROP][SPECIAL_PROP] : undefined, undefined);
//            if (oid) {
//                if (Globals.mode === MODE_RECORD) {
//                    obj[SPECIAL_PROP].__proto__ = proto[SPECIAL_PROP];
//                } else if (Globals.mode === MODE_REPLAY) {
//                    obj.__proto__ = getConcrete(objectMap[oid]);
//                }
//            }
//        };
//
//        /**
//         * getField
//         */
//        this.RR_G = function(iid, base_c, offset, val) {
//            var type, tmp, mod_offset;
//
//            offset = getConcrete(offset);
//            mod_offset = (offset === '__proto__' ? SPECIAL_PROP + offset : offset);
//            if (Globals.mode === MODE_RECORD) {
//                if ((type = typeof base_c) === 'string' ||
//                    type === 'number' ||
//                    type === 'boolean') {
//                    seqNo++;
//                    return val;
//                } else if (!HOP(base_c, SPECIAL_PROP) || !base_c[SPECIAL_PROP]) {
//                    return this.RR_L(iid, val, N_LOG_GETFIELD);
//                } else if ((tmp = base_c[SPECIAL_PROP][mod_offset]) === val ||
//                    // TODO what is going on with this condition? This is isNaN check
//                    (val !== val && tmp !== tmp)) {
//                    seqNo++;
//                    return val;
//                } else {
//                    if (HOP(base_c, offset) && !hasGetterSetter(base_c, offset, false)) {
//                        // add the field to the shadow value, so we don't need to log
//                        // future reads.  Only do so if the property is defined directly
//                        // on the object, to avoid incorrectly adding the property to
//                        // the object directly during replay (see test prototype_property.js)
//                        base_c[SPECIAL_PROP][mod_offset] = val;
//                        return this.RR_L(iid, val, N_LOG_GETFIELD_OWN);
//                    }
//                    return this.RR_L(iid, val, N_LOG_GETFIELD);
//                }
//            } else if (Globals.mode === MODE_REPLAY) {
//                var rec;
//                if ((rec = traceReader.getCurrent()) === undefined) {
//                    traceReader.next();
//                    return val;
//                } else {
//                    val = this.RR_L(iid, val, N_LOG_GETFIELD);
//                    // only add direct object properties
//                    if (rec[F_FUNNAME] === N_LOG_GETFIELD_OWN) {
//                        // do not store ConcreteValue to __proto__
//                        base_c[offset] = (offset === '__proto__') ? getConcrete(val) : val;
//                    }
//                    return val;
//                }
//            } else {
//                return val;
//            }
//        };
//
//
//        this.RR_P = function(iid, base, offset, val) {
//            if (Globals.mode === MODE_RECORD) {
//                var base_c = getConcrete(base);
//                if (HOP(base_c, SPECIAL_PROP) && base_c[SPECIAL_PROP]) {
//                    base_c[SPECIAL_PROP][getConcrete(offset)] = val;
//                }
//            }
//        };
//
//        this.RR_W = function(iid, name, val) {
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                getFrameContainingVar(name)[name] = val;
//            }
//        };
//
//        this.RR_N = function(iid, name, val, isArgumentSync) {
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                if (isArgumentSync === false || (isArgumentSync === true && Globals.isInstrumentedCaller)) {
//                    return frame[name] = val;
//                } else if (isArgumentSync === true && !Globals.isInstrumentedCaller) {
//                    frame[name] = undefined;
//                    return this.RR_R(iid, name, val, true);
//                }
//            }
//        };
//
//        this.RR_R = function(iid, name, val, useTopFrame) {
//            var ret, trackedVal, trackedFrame, tmp;
//
//            if (useTopFrame || name === 'this') {
//                trackedFrame = frame;
//            } else {
//                trackedFrame = getFrameContainingVar(name);
//            }
//            trackedVal = trackedFrame[name];
//
//            if (Globals.mode === MODE_RECORD) {
//                if (trackedVal === val ||
//                    (val !== val && trackedVal !== trackedVal) ||
//                    (name === "this" && Globals.isInstrumentedCaller && !Globals.isConstructorCall && Globals.isMethodCall)) {
//                    seqNo++;
//                    ret = val;
//                } else {
//                    trackedFrame[name] = val;
//                    ret = this.RR_L(iid, val, N_LOG_READ);
//                }
//            } else if (Globals.mode === MODE_REPLAY) {
//                if (traceReader.getCurrent() === undefined) {
//                    traceReader.next();
//                    if (name === "this" && Globals.isInstrumentedCaller && !Globals.isConstructorCall && Globals.isMethodCall) {
//                        ret = val;
//                    } else {
//                        ret = trackedVal;
//                    }
//                } else {
//                    ret = trackedFrame[name] = this.RR_L(iid, val, N_LOG_READ);
//                }
//            } else {
//                ret = val;
//            }
//            return ret;
//        };
//
//        this.RR_Load = function(iid, val, sval) {
//            //var ret, trackedVal, trackedFrame, tmp;
//            var ret;
//
//            if (Globals.mode === MODE_RECORD) {
//                if (sval === val ||
//                    (val !== val && sval !== sval)) {
//                    seqNo++;
//                    ret = val;
//                } else {
//                    ret = this.RR_L(iid, val, N_LOG_LOAD);
//                }
//            } else if (Globals.mode === MODE_REPLAY) {
//                if (traceReader.getCurrent() === undefined) {
//                    traceReader.next();
//                    ret = val;
//                } else {
//                    ret = this.RR_L(iid, val, N_LOG_LOAD);
//                }
//            } else {
//                ret = val;
//            }
//            return ret;
//        };
//
//        this.RR_Fe = function(iid, val, dis) {
//            var ret;
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                frameStack.push(frame = {
//                    "this": undefined
//                });
//                frame[SPECIAL_PROP3] = val[SPECIAL_PROP3];
//                if (!Globals.isInstrumentedCaller) {
//                    if (Globals.mode === MODE_RECORD) {
//                        var tmp = printableValue(val);
//                        logValue(iid, tmp, N_LOG_FUNCTION_ENTER);
//                        tmp = printableValue(dis);
//                        logValue(iid, tmp, N_LOG_FUNCTION_ENTER);
//                    } else if (Globals.mode === MODE_REPLAY) {
//                        ret = traceReader.getAndNext();
//                        checkPath(ret, iid);
//                        syncValue(ret, val, iid);
//                        ret = traceReader.getAndNext();
//                        checkPath(ret, iid);
//                        syncValue(ret, dis, iid);
//                        debugPrint("Index:" + traceReader.getPreviousIndex());
//                    }
//                }
//            }
//        };
//
//        this.RR_Fr = function(iid) {
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                frameStack.pop();
//                frame = frameStack[frameStack.length - 1];
//                if (Globals.mode === MODE_RECORD && frameStack.length <= 1) {
//                    traceWriter.flush();
//                }
//            }
//        };
//
//        this.RR_Se = function(iid, val) {
//            var ret;
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                frameStack.push(frame = {
//                    "this": undefined
//                });
//                frame[SPECIAL_PROP3] = frameStack[0];
//                if (Globals.mode === MODE_RECORD) {
//                    var tmp = printableValue(val);
//                    logValue(iid, tmp, N_LOG_SCRIPT_ENTER);
//                } else if (Globals.mode === MODE_REPLAY) {
//                    ret = traceReader.getAndNext();
//                    checkPath(ret, iid);
//                    debugPrint("Index:" + traceReader.getPreviousIndex());
//                }
//            }
//        };
//
//        this.RR_Sr = function(iid) {
//            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
//                frameStack.pop();
//                frame = frameStack[frameStack.length - 1];
//                if (Globals.mode === MODE_RECORD && frameStack.length <= 1) {
//                    traceWriter.flush();
//                    if (Config.LOG_ALL_READS_AND_BRANCHES) {
//                        if (Globals.mode === MODE_RECORD && !Constants.isBrowser) {
//                            require('fs').writeFileSync("readAndBranchLogs.record", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
//                        }
//                    }
//
//                }
//            }
//            if (Constants.isBrowserReplay) {
//                this.RR_replay();
//            }
//        };
//
//        this.RR_H = function(iid, val) {
//            var ret;
//            if (Globals.mode === MODE_RECORD) {
//                ret = Object.create(null);
//                for (var i in val) {
//                    if (i !== SPECIAL_PROP && i !== SPECIAL_PROP2 && i !== SPECIAL_PROP3) {
//                        ret[i] = 1;
//                    }
//                }
//                var tmp = [];
//                tmp[F_TYPE] = getNumericType(ret);
//                tmp[F_VALUE] = ret;
//                logValue(iid, tmp, N_LOG_HASH);
//                val = ret;
//            } else if (Globals.mode === MODE_REPLAY) {
//                ret = traceReader.getAndNext();
//                checkPath(ret, iid);
//                debugPrint("Index:" + traceReader.getPreviousIndex());
//                val = ret[F_VALUE];
//                ret = Object.create(null);
//                for (i in val) {
//                    if (HOP(val, i)) {
//                        ret[i] = 1;
//                    }
//                }
//                val = ret;
//            }
//            return val;
//        };
//
//
//        this.RR_L = function(iid, val, fun) {
//            var ret, tmp, old;
//            if (Globals.mode === MODE_RECORD) {
//                old = createdMockObject;
//                createdMockObject = false;
//                tmp = printableValue(val);
//                logValue(iid, tmp, fun);
//                if (createdMockObject) this.syncPrototypeChain(iid, val);
//                createdMockObject = old;
//            } else if (Globals.mode === MODE_REPLAY) {
//                ret = traceReader.getCurrent();
//                checkPath(ret, iid, fun);
//                traceReader.next();
//                debugPrint("Index:" + traceReader.getPreviousIndex());
//                old = createdMockObject;
//                createdMockObject = false;
//                val = syncValue(ret, val, iid);
//                if (createdMockObject) this.syncPrototypeChain(iid, val);
//                createdMockObject = old;
//            }
//            return val;
//        };
//
//        this.RR_T = function(iid, val, fun, hasGetterSetter) {
//            if ((Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) &&
//                (fun === N_LOG_ARRAY_LIT || fun === N_LOG_FUNCTION_LIT || fun === N_LOG_OBJECT_LIT || fun === N_LOG_REGEXP_LIT)) {
//                //                    console.log("iid:"+iid)  // uncomment for divergence
//                setLiteralId(val, hasGetterSetter);
//                if (fun === N_LOG_FUNCTION_LIT) {
//                    if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                        Object.defineProperty(val, SPECIAL_PROP3, {
//                            enumerable: false,
//                            writable: true
//                        });
//                    }
//                    val[SPECIAL_PROP3] = frame;
//                }
//            }
//        };
//
//        this.RR_replay = function() {
//            if (Globals.mode === MODE_REPLAY) {
//                while (true) {
//                    var ret = traceReader.getCurrent();
//                    if (typeof ret !== 'object') {
//                        if (Constants.isBrowserReplay) {
//                            sandbox.endExecution();
//                        }
//                        return;
//                    }
//                    var f, prefix;
//                    if (ret[F_FUNNAME] === N_LOG_SPECIAL) {
//                        prefix = ret[F_VALUE];
//                        traceReader.next();
//                        ret = traceReader.getCurrent();
//                        if (sandbox.analysis && sandbox.analysis.beginExecution) {
//                            sandbox.analysis.beginExecution(prefix);
//                        }
//                    }
//                    if (ret[F_FUNNAME] === N_LOG_FUNCTION_ENTER) {
//                        f = getConcrete(syncValue(ret, undefined, 0));
//                        ret = traceReader.getNext();
//                        var dis = syncValue(ret, undefined, 0);
//                        Function.prototype.call.call(f, dis);
//                        //                        f.call(dis);
//                    } else if (ret[F_FUNNAME] === N_LOG_SCRIPT_ENTER) {
//                        var path = getConcrete(syncValue(ret, undefined, 0));
//                        if (Constants.isBrowserReplay) {
//                            load(path);
//                            return;
//                        } else {
//                            var pth = require('path');
//                            var filep = pth.resolve(path);
//                            require(filep);
//                            // a browser can load a script multiple times.  So,
//                            // we need to remove the script from Node's cache,
//                            // in case it gets loaded again
//                            require.uncache(filep);
//                        }
//                    } else {
//                        return;
//                    }
//                }
//            }
//        };
//
//
//        this.setTraceFileName = function(tFN) {
//            Globals.traceFileName = tFN;
//            if (traceReader) {
//                traceReader.populateObjectIdLife();
//            }
//        }
//
//
//        var tmp_LOG_ALL_READS_AND_BRANCHES = false;
//        if (Globals.mode === MODE_REPLAY) {
//            traceReader = new TraceReader();
//            this.addRecord = traceReader.addRecord;
//        } else if (Globals.mode === MODE_RECORD) {
//            Globals.traceWriter = traceWriter = new TraceWriter();
//            this.onflush = traceWriter.onflush;
//            if (Constants.isBrowser) {
//                if (!Constants.IN_MEMORY_TRACE) {
//                    this.command('reset');
//                }
//                // enable keyboard shortcut to stop tracing
//                window.addEventListener('keydown', function(e) {
//                    // keyboard shortcut is Alt-Shift-T for now
//                    if (e.altKey && e.shiftKey && e.keyCode === 84) {
//                        traceWriter.stopTracing();
//                        traceWriter.onflush(function() {
//                            if (tmp_LOG_ALL_READS_AND_BRANCHES) console.save(Globals.loadAndBranchLogs, "readAndBranchLogs.record");
//                            alert("trace flush complete");
//                        });
//                        tmp_LOG_ALL_READS_AND_BRANCHES = Config.LOG_ALL_READS_AND_BRANCHES;
//                        Config.LOG_ALL_READS_AND_BRANCHES = false;
//                    }
//                });
//            }
//        }
//    }
//
//    if (!sandbox.Constants.isBrowser && typeof require === 'function') {
//        /**
//         * remove a loaded module from Node's cache
//         * @param moduleName the name of the module
//         */
//        require.uncache = function(moduleName) {
//            require.searchCache(moduleName, function(mod) {
//                delete require.cache[mod.id];
//            });
//        };
//
//        /**
//         * apply an operation to a module already loaded and
//         * cached by Node
//         * @param moduleName the name of the module
//         * @param callback the operation to perform
//         */
//        require.searchCache = function(moduleName, callback) {
//            var mod = require.resolve(moduleName);
//
//            if (mod && ((mod = require.cache[mod]) !== undefined)) {
//                (function run(mod) {
//                    mod.children.forEach(function(child) {
//                        run(child);
//                    });
//                    callback(mod);
//                })(mod);
//            }
//        };
//    }
//
//
//    //----------------------------------- End Record Replay Engine ---------------------------------
//})(J$);
//
////----------------------------------- End Record Replay Engine ---------------------------------
//
///*
// * Copyright 2013 Samsung Information Systems America, Inc.
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *        http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
//
//// Author: Koushik Sen
//
//
///*
// To perform analysis in browser without recording, set window.JALANGI_MODE to 'inbrowser' and J$.analysis to a suitable analysis file.
// In the inbrowser mode, one has access to the object J$.smemory, which denotes the shadow memory.
// smemory.getShadowObject(obj) returns the shadow object associated with obj if type of obj is "object" or "function".
// smemory.getFrame(varName) returns the activation frame that contains the variable named "varName".
// To redefine all instrumentation functions, set JALANGI_MODE to 'symbolic' and J$.analysis to a suitable library containing redefinitions of W, R, etc.
//
// */
//
///*jslint node: true browser: true */
///*global J$ alert */
//
//// wrap in anonymous function to create local namespace when in browser
//// create / reset J$ global variable to hold analysis runtime
//if (typeof J$ === 'undefined') {
//    J$ = {};
//}
//
//window = {
//    String: String,
//    Array: Array,
//    Error: Error,
//    Number: Number,
//    Date: Date,
//    Boolean: Boolean,
//    RegExp: RegExp
//};
//
//(function(sandbox) {
//    var Constants = sandbox.Constants;
//    var Globals = sandbox.Globals;
//    var Config = sandbox.Config;
//    var SMemory = sandbox.SMemory;
//    var RecordReplayEngine = sandbox.RecordReplayEngine;
//
//    //    var Globals = (typeof sandbox.Globals === 'undefined'? require('./Globals.js'): sandbox.Globals);
//    //    var Config = (typeof sandbox.Config === 'undefined'? require('./Config.js'): sandbox.Config);
//    //    var RecordReplayEngine = (typeof sandbox.RecordReplayEngine === 'undefined'? require('./RecordReplayEngine.js'): sandbox.RecordReplayEngine);
//
//
//    function init(mode_name, analysis_script, initSMemory) {
//
//        var MODE_RECORD = Constants.MODE_RECORD,
//            MODE_REPLAY = Constants.MODE_REPLAY,
//            MODE_NO_RR_IGNORE_UNINSTRUMENTED = Constants.MODE_NO_RR_IGNORE_UNINSTRUMENTED,
//            MODE_NO_RR = Constants.MODE_NO_RR,
//            MODE_DIRECT = Constants.MODE_DIRECT;
//        var getConcrete = Constants.getConcrete;
//        var HOP = Constants.HOP;
//        var EVAL_ORG = eval;
//        var isBrowser = Constants.isBrowser;
//
//
//        var SPECIAL_PROP = Constants.SPECIAL_PROP;
//        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2;
//        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3;
//
//        var N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT,
//            N_LOG_RETURN = Constants.N_LOG_RETURN,
//            N_LOG_OPERATION = Constants.N_LOG_OPERATION;
//
//
//        var mode = Globals.mode = (function(str) {
//            switch (str) {
//                case "record":
//                    return MODE_RECORD;
//                case "replay":
//                    return MODE_REPLAY;
//                case "analysis":
//                    return MODE_NO_RR_IGNORE_UNINSTRUMENTED;
//                case "inbrowser":
//                    return MODE_NO_RR;
//                case "symbolic":
//                    return MODE_DIRECT;
//                default:
//                    return MODE_RECORD;
//            }
//        })(mode_name);
//        var isBrowserReplay = Globals.isBrowserReplay = Constants.isBrowser && Globals.mode === MODE_REPLAY;
//        Globals.isInstrumentedCaller = false;
//        Globals.isConstructorCall = false;
//        Globals.isMethodCall = false;
//
//        if (Globals.mode === MODE_DIRECT) {
//            /* JALANGI_ANALYSIS file must define all instrumentation functions such as U, B, C, C1, C2, W, R, G, P */
//            if (analysis_script) {
//                require(require('path').resolve(analysis_script))(sandbox);
//                if (sandbox.postLoad) {
//                    sandbox.postLoad();
//                }
//            }
//        } else {
//
//            var rrEngine;
//            var branchCoverageInfo;
//            var smemory;
//
//
//            if (mode === MODE_RECORD || mode === MODE_REPLAY) {
//                rrEngine = new RecordReplayEngine();
//            }
//            if (initSMemory) {
//                sandbox.smemory = smemory = new SMemory();
//            }
//
//
//            //-------------------------------------- Symbolic functions -----------------------------------------------------------
//
//            function create_fun(f) {
//                return function() {
//                    var len = arguments.length;
//                    for (var i = 0; i < len; i++) {
//                        arguments[i] = getConcrete(arguments[i]);
//                    }
//                    return f.apply(getConcrete(this), arguments);
//                }
//            }
//
//            function concretize(obj) {
//                for (var key in obj) {
//                    if (HOP(obj, key)) {
//                        obj[key] = getConcrete(obj[key]);
//                    }
//                }
//            }
//
//            function modelDefineProperty(f) {
//                return function() {
//                    var len = arguments.length;
//                    for (var i = 0; i < len; i++) {
//                        arguments[i] = getConcrete(arguments[i]);
//                    }
//                    if (len === 3) {
//                        concretize(arguments[2]);
//                    }
//                    return f.apply(getConcrete(this), arguments);
//                }
//            }
//
//            function getSymbolicFunctionToInvokeAndLog(f, isConstructor) {
//                if (f === Array ||
//                    f === Error ||
//                    f === String ||
//                    f === Number ||
//                    f === Date ||
//                    f === Boolean ||
//                    f === RegExp ||
//                    f === sandbox.addAxiom ||
//                    f === sandbox.readInput) {
//                    return [f, true];
//                } else if ( //f === Function.prototype.apply ||
//                    //f === Function.prototype.call ||
//                    f === console.log ||
//                    (typeof getConcrete(arguments[0]) === 'string' && f === RegExp.prototype.test) || // fixes bug in minPathDev.js
//                    f === String.prototype.indexOf ||
//                    f === String.prototype.lastIndexOf ||
//                    f === String.prototype.substring ||
//                    f === String.prototype.substr ||
//                    f === String.prototype.charCodeAt ||
//                    f === String.prototype.charAt ||
//                    f === String.prototype.replace ||
//                    f === String.fromCharCode ||
//                    f === Math.abs ||
//                    f === Math.acos ||
//                    f === Math.asin ||
//                    f === Math.atan ||
//                    f === Math.atan2 ||
//                    f === Math.ceil ||
//                    f === Math.cos ||
//                    f === Math.exp ||
//                    f === Math.floor ||
//                    f === Math.log ||
//                    f === Math.max ||
//                    f === Math.min ||
//                    f === Math.pow ||
//                    f === Math.round ||
//                    f === Math.sin ||
//                    f === Math.sqrt ||
//                    f === Math.tan ||
//                    f === parseInt) {
//                    return [create_fun(f), false];
//                } else if (f === Object.defineProperty) {
//                    return [modelDefineProperty(f), false];
//                }
//                return [null, true];
//            }
//
//
//            //---------------------------- Utility functions -------------------------------
//            function addAxiom(c) {
//                if (sandbox.analysis && sandbox.analysis.installAxiom) {
//                    sandbox.analysis.installAxiom(c);
//                }
//            }
//
//            var loadAndBranchLogs = Globals.loadAndBranchLogs;
//
//            function printValueForTesting(loc, iid, val) {
//                if (!Config.LOG_ALL_READS_AND_BRANCHES) return;
//                var type = typeof val,
//                    str;
//                if (type !== 'object' && type !== 'function') {
//                    str = loc + ":" + iid + ":" + type + ":" + val;
//                    loadAndBranchLogs.push(str);
//                } else if (val === null) {
//                    str = loc + ":" + iid + ":" + type + ":" + val;
//                    loadAndBranchLogs.push(str);
//                } else if (HOP(val, SPECIAL_PROP) && HOP(val[SPECIAL_PROP], SPECIAL_PROP)) {
//                    str = loc + ":" + iid + ":" + type + ":" + val[SPECIAL_PROP][SPECIAL_PROP];
//                    loadAndBranchLogs.push(str);
//                } else {
//                    str = loc + ":" + iid + ":" + type + ":object";
//                    loadAndBranchLogs.push(str);
//                }
//            }
//
//            //---------------------------- End utility functions -------------------------------
//
//
//            //----------------------------------- Begin Jalangi Library backend ---------------------------------
//
//            // stack of return values from instrumented functions.
//            // we need to keep a stack since a function may return and then
//            // have another function call in a finally block (see test
//            // call_in_finally.js)
//            var returnVal = [];
//            var exceptionVal;
//            var scriptCount = 0;
//            var lastVal;
//            var switchLeft;
//            var switchKeyStack = [];
//            var argIndex;
//
//
//            /**
//             * invoked when the client analysis throws an exception
//             * @param e
//             */
//            function clientAnalysisException(e) {
//                console.error("analysis exception!!!");
//                console.error(e.stack);
//                if (isBrowser) {
//                    // we don't really know what will happen to the exception,
//                    // but we don't have a way to just terminate, so throw it
//                    throw e;
//                } else {
//                    // under node.js, just die
//                    process.exit(1);
//                }
//            }
//
//            function isNative(f) {
//                return f.toString().indexOf('[native code]') > -1 || f.toString().indexOf('[object ') === 0;
//            }
//
//            function callAsNativeConstructorWithEval(Constructor, args) {
//                var a = [];
//                for (var i = 0; i < args.length; i++)
//                    a[i] = 'args[' + i + ']';
//                var eval = EVAL_ORG;
//                return eval('new Constructor(' + a.join() + ')');
//            }
//
//            function callAsNativeConstructor(Constructor, args) {
//                if (args.length === 0) {
//                    return new Constructor();
//                }
//                if (args.length === 1) {
//                    return new Constructor(args[0]);
//                }
//                if (args.length === 2) {
//                    return new Constructor(args[0], args[1]);
//                }
//                if (args.length === 3) {
//                    return new Constructor(args[0], args[1], args[2]);
//                }
//                if (args.length === 4) {
//                    return new Constructor(args[0], args[1], args[2], args[3]);
//                }
//                if (args.length === 5) {
//                    return new Constructor(args[0], args[1], args[2], args[3], args[4]);
//                }
//                return callAsNativeConstructorWithEval(Constructor, args);
//            }
//
//            function callAsConstructor(Constructor, args) {
//                //                if (isNative(Constructor)) {
//                if (true) {
//                    var ret = callAsNativeConstructor(Constructor, args);
//                    return ret;
//                } else {
//                    var Temp = function() {}, inst, ret;
//                    Temp.prototype = getConcrete(Constructor.prototype);
//                    inst = new Temp;
//                    ret = Constructor.apply(inst, args);
//                    return Object(ret) === ret ? ret : inst;
//                }
//            }
//
//
//            function invokeEval(base, f, args) {
//                if (rrEngine) {
//                    rrEngine.RR_evalBegin();
//                }
//                if (smemory) {
//                    smemory.evalBegin();
//                }
//                try {
//                    return f(sandbox.instrumentCode(getConcrete(args[0]), {
//                        wrapProgram: false,
//                        isEval: true
//                    }).code);
//                } finally {
//                    if (rrEngine) {
//                        rrEngine.RR_evalEnd();
//                    }
//                    if (smemory) {
//                        smemory.evalEnd();
//                    }
//                }
//            }
//
//
//            function invokeFun(iid, base, f, args, isConstructor, isMethod) {
//                var g, invoke, val, ic, tmp_rrEngine, tmpIsConstructorCall, tmpIsInstrumentedCaller, idx, tmpIsMethodCall;
//
//                var f_c = getConcrete(f);
//
//                tmpIsConstructorCall = Globals.isConstructorCall;
//                Globals.isConstructorCall = isConstructor;
//                tmpIsMethodCall = Globals.isMethodCall;
//                Globals.isMethodCall = isMethod;
//
//
//                if (sandbox.analysis && sandbox.analysis.invokeFunPre) {
//                    tmp_rrEngine = rrEngine;
//                    rrEngine = null;
//                    try {
//                        sandbox.analysis.invokeFunPre(iid, f, base, args, isConstructor);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    rrEngine = tmp_rrEngine;
//                }
//
//
//                var arr = getSymbolicFunctionToInvokeAndLog(f_c, isConstructor);
//                tmpIsInstrumentedCaller = Globals.isInstrumentedCaller;
//                ic = Globals.isInstrumentedCaller = f_c === undefined || HOP(f_c, SPECIAL_PROP2) || typeof f_c !== "function";
//
//                if (mode === MODE_RECORD || mode === MODE_NO_RR) {
//                    invoke = true;
//                    g = f_c;
//                } else if (mode === MODE_REPLAY || mode === MODE_NO_RR_IGNORE_UNINSTRUMENTED) {
//                    invoke = arr[0] || Globals.isInstrumentedCaller;
//                    g = arr[0] || f_c;
//                }
//
//                pushSwitchKey();
//                try {
//                    if (g === EVAL_ORG) {
//                        val = invokeEval(base, g, args);
//                    } else if (invoke) {
//                        if (isConstructor) {
//                            val = callAsConstructor(g, args);
//                        } else {
//                            val = Function.prototype.apply.call(g, base, args);
//                            //val = g.apply(base, args);
//                        }
//                    } else {
//                        if (rrEngine) {
//                            rrEngine.RR_replay();
//                        }
//                        val = undefined;
//                    }
//                } finally {
//                    popSwitchKey();
//                    Globals.isInstrumentedCaller = tmpIsInstrumentedCaller;
//                    Globals.isConstructorCall = tmpIsConstructorCall;
//                    Globals.isMethodCall = tmpIsMethodCall;
//                }
//
//                if (!ic && arr[1]) {
//                    if (rrEngine) {
//                        val = rrEngine.RR_L(iid, val, N_LOG_RETURN);
//                    }
//                }
//                if (sandbox.analysis && sandbox.analysis.invokeFun) {
//                    tmp_rrEngine = rrEngine;
//                    rrEngine = null;
//                    try {
//                        val = sandbox.analysis.invokeFun(iid, f, base, args, val, isConstructor);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    rrEngine = tmp_rrEngine;
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(val);
//                    }
//                }
//                printValueForTesting("Ret", iid, val);
//                return val;
//            }
//
//            //var globalInstrumentationInfo;
//
//            // getField (property read)
//            function G(iid, base, offset, norr) {
//                if (offset === SPECIAL_PROP || offset === SPECIAL_PROP2 || offset === SPECIAL_PROP3) {
//                    return undefined;
//                }
//
//                var base_c = getConcrete(base);
//                //                if (rrEngine) {
//                //                    base_c = rrEngine.RR_preG(iid, base, offset);
//                //                }
//
//                if (sandbox.analysis && sandbox.analysis.getFieldPre && getConcrete(offset) !== '__proto__') {
//                    try {
//                        sandbox.analysis.getFieldPre(iid, base, offset);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                var val = base_c[getConcrete(offset)];
//
//
//                if (rrEngine && !norr) {
//                    val = rrEngine.RR_G(iid, base_c, offset, val);
//                }
//                if (sandbox.analysis && sandbox.analysis.getField && getConcrete(offset) !== '__proto__') {
//                    var tmp_rrEngine = rrEngine;
//                    rrEngine = null;
//                    try {
//                        val = sandbox.analysis.getField(iid, base, offset, val);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    rrEngine = tmp_rrEngine;
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(val);
//                    }
//                }
//
//                if (rrEngine) {
//                    rrEngine.RR_replay();
//                    rrEngine.RR_Load(iid);
//                }
//
//                printValueForTesting("J$.G", iid, val);
//                return val;
//            }
//
//            // putField (property write)
//            function P(iid, base, offset, val) {
//                if (offset === SPECIAL_PROP || offset === SPECIAL_PROP2 || offset === SPECIAL_PROP3) {
//                    return undefined;
//                }
//
//                // window.location.hash = hash calls a function out of nowhere.
//                // fix needs a call to RR_replay and setting isInstrumentedCaller to false
//                // the following patch is not elegant
//                var tmpIsInstrumentedCaller = Globals.isInstrumentedCaller;
//                Globals.isInstrumentedCaller = false;
//
//                var base_c = getConcrete(base);
//                if (sandbox.analysis && sandbox.analysis.putFieldPre) {
//                    try {
//                        val = sandbox.analysis.putFieldPre(iid, base, offset, val);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                if (typeof base_c === 'function' && getConcrete(offset) === 'prototype') {
//                    base_c[getConcrete(offset)] = getConcrete(val);
//                } else {
//                    base_c[getConcrete(offset)] = val;
//                }
//
//                if (rrEngine) {
//                    rrEngine.RR_P(iid, base, offset, val);
//                }
//                if (sandbox.analysis && sandbox.analysis.putField) {
//                    try {
//                        val = sandbox.analysis.putField(iid, base, offset, val);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                // the following patch was not elegant
//                // but now it is better (got rid of offset+"" === "hash" check)
//                if (rrEngine) { //} && ((offset + "") === "hash")) {
//                    rrEngine.RR_replay();
//                    rrEngine.RR_Load(iid); // add a dummy (no record) in the trace so that RR_Replay does not replay non-setter method
//                }
//
//                // the following patch is not elegant
//                Globals.isInstrumentedCaller = tmpIsInstrumentedCaller;
//                return val;
//            }
//
//            // Function call (e.g., f())
//            function F(iid, f, isConstructor) {
//                return function() {
//                    var base = this;
//                    return invokeFun(iid, base, f, arguments, isConstructor, false);
//                }
//            }
//
//            // Method call (e.g., e.f())
//            function M(iid, base, offset, isConstructor) {
//                return function() {
//                    var f = G(iid + 2, base, offset);
//                    return invokeFun(iid, base, f, arguments, isConstructor, true);
//                };
//            }
//
//            // Function enter
//            function Fe(iid, val, dis /* this */ , args) {
//                argIndex = 0;
//                if (rrEngine) {
//                    rrEngine.RR_Fe(iid, val, dis);
//                }
//                if (smemory) {
//                    smemory.functionEnter(val);
//                }
//                returnVal.push(undefined);
//                exceptionVal = undefined;
//                if (sandbox.analysis && sandbox.analysis.functionEnter) {
//                    if (rrEngine) {
//                        val = rrEngine.RR_getConcolicValue(val);
//                    }
//                    try {
//                        sandbox.analysis.functionEnter(iid, val, dis, args);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                printValueForTesting("Call", iid, val);
//            }
//
//            // Function exit
//            function Fr(iid) {
//                var ret = false,
//                    tmp;
//                if (rrEngine) {
//                    rrEngine.RR_Fr(iid);
//                }
//                if (smemory) {
//                    smemory.functionReturn();
//                }
//                if (sandbox.analysis && sandbox.analysis.functionExit) {
//                    try {
//                        ret = sandbox.analysis.functionExit(iid);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                // if there was an uncaught exception, throw it
//                // here, to preserve exceptional control flow
//                if (exceptionVal !== undefined) {
//                    tmp = exceptionVal;
//                    exceptionVal = undefined;
//                    throw tmp;
//                }
//                return ret;
//            }
//
//            // Uncaught exception
//            function Ex(iid, e) {
//                exceptionVal = e;
//            }
//
//            // Return statement
//            function Rt(iid, val) {
//                returnVal.pop();
//                returnVal.push(val);
//                if (sandbox.analysis && sandbox.analysis.return_) {
//                    try {
//                        val = sandbox.analysis.return_(val);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                return val;
//            }
//
//            // Actual return from function, invoked from 'finally' block
//            // added around every function by instrumentation.  Reads
//            // the return value stored by call to Rt()
//            function Ra() {
//                var ret = returnVal.pop();
//                //returnVal = undefined;
//                exceptionVal = undefined;
//                return ret;
//            }
//
//            // Script enter
//            function Se(iid, val) {
//                scriptCount++;
//                if (rrEngine) {
//                    rrEngine.RR_Se(iid, val);
//                }
//                if (smemory) {
//                    smemory.scriptEnter();
//                }
//                if (sandbox.analysis && sandbox.analysis.scriptEnter) {
//                    try {
//                        sandbox.analysis.scriptEnter(iid, val);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//            }
//
//            // Script exit
//            function Sr(iid) {
//                var tmp;
//                scriptCount--;
//                if (rrEngine) {
//                    rrEngine.RR_Sr(iid);
//                }
//                if (smemory) {
//                    smemory.scriptReturn();
//                }
//                if (sandbox.analysis && sandbox.analysis.scriptExit) {
//                    try {
//                        sandbox.analysis.scriptExit(iid);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                if (mode === MODE_NO_RR_IGNORE_UNINSTRUMENTED && scriptCount === 0) {
//                    endExecution();
//                }
//                if (exceptionVal !== undefined) {
//                    tmp = exceptionVal;
//                    exceptionVal = undefined;
//                    if ((mode === MODE_REPLAY && scriptCount > 0) || isBrowserReplay) {
//                        throw tmp;
//                    } else {
//                        console.error(tmp);
//                        console.error(tmp.stack);
//                    }
//                }
//            }
//
//            // Ignore argument (identity).
//            // TODO Why do we need this?
//            function I(val) {
//                return val;
//            }
//
//            // object/function/regexp/array Literal
//            function T(iid, val, type, hasGetterSetter) {
//                if (sandbox.analysis && sandbox.analysis.literalPre) {
//                    try {
//                        sandbox.analysis.literalPre(iid, val, hasGetterSetter);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                if (rrEngine) {
//                    rrEngine.RR_T(iid, val, type, hasGetterSetter);
//                }
//                if (smemory) {
//                    smemory.defineFunction(val, type);
//                }
//                if (type === N_LOG_FUNCTION_LIT) {
//                    if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
//                        Object.defineProperty(val, SPECIAL_PROP2, {
//                            enumerable: false,
//                            writable: true
//                        });
//                    }
//                    val[SPECIAL_PROP2] = true;
//                }
//
//                // inform analysis, which may modify the literal
//                if (sandbox.analysis && sandbox.analysis.literal) {
//                    try {
//                        val = sandbox.analysis.literal(iid, val, hasGetterSetter);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(val);
//                    }
//                }
//
//                return val;
//            }
//
//            // hash in for-in
//            // E.g., given code 'for (p in x) { ... }',
//            // H is invoked with the value of x
//            function H(iid, val) {
//                if (rrEngine) {
//                    val = rrEngine.RR_H(iid, val);
//                }
//                return val;
//            }
//
//            // variable read
//            function R(iid, name, val, isGlobal, isPseudoGlobal) {
//                if (sandbox.analysis && sandbox.analysis.readPre) {
//                    try {
//                        sandbox.analysis.readPre(iid, name, val, isGlobal);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                if (rrEngine && (name === 'this' || isGlobal)) {
//                    val = rrEngine.RR_R(iid, name, val);
//                }
//                if (sandbox.analysis && sandbox.analysis.read) {
//                    try {
//                        val = sandbox.analysis.read(iid, name, val, isGlobal);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    if (rrEngine) { // && (name==='this' || isGlobal)) {
//                        rrEngine.RR_updateRecordedObject(val);
//                    }
//                }
//                printValueForTesting("J$.R", iid, val);
//                return val;
//            }
//
//            // variable write
//            function W(iid, name, val, lhs, isGlobal, isPseudoGlobal) {
//                if (sandbox.analysis && sandbox.analysis.writePre) {
//                    try {
//                        sandbox.analysis.writePre(iid, name, val, lhs);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                if (rrEngine && isGlobal) {
//                    rrEngine.RR_W(iid, name, val);
//                }
//                if (sandbox.analysis && sandbox.analysis.write) {
//                    try {
//                        val = sandbox.analysis.write(iid, name, val, lhs);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                return val;
//            }
//
//            // variable declaration (Init)
//            function N(iid, name, val, isArgumentSync, isLocalSync, isCatchParam) {
//                // isLocalSync is only true when we sync variables inside a for-in loop
//                isCatchParam = !! isCatchParam
//                if (isArgumentSync) {
//                    argIndex++;
//                }
//                if (rrEngine) {
//                    val = rrEngine.RR_N(iid, name, val, isArgumentSync);
//                }
//                if (!isLocalSync && !isCatchParam && smemory) {
//                    smemory.initialize(name);
//                }
//                if (!isLocalSync && sandbox.analysis && sandbox.analysis.declare) {
//                    try {
//                        if (isArgumentSync && argIndex > 1) {
//                            sandbox.analysis.declare(iid, name, val, isArgumentSync, argIndex - 2, isCatchParam);
//                        } else {
//                            sandbox.analysis.declare(iid, name, val, isArgumentSync, -1, isCatchParam);
//                        }
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//                return val;
//            }
//
//            // Modify and assign +=, -= ...
//            // TODO is this dead or still used?
//            // definitely used --KS
//            function A(iid, base, offset, op) {
//                var oprnd1 = G(iid, base, offset);
//                return function(oprnd2) {
//                    var val = B(iid, op, oprnd1, oprnd2);
//                    return P(iid, base, offset, val);
//                };
//            }
//
//            // Binary operation
//            function B(iid, op, left, right) {
//                var left_c, right_c, result_c, isArith = false;
//
//                if (sandbox.analysis && sandbox.analysis.binaryPre) {
//                    try {
//                        sandbox.analysis.binaryPre(iid, op, left, right);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                left_c = getConcrete(left);
//                right_c = getConcrete(right);
//
//                switch (op) {
//                    case "+":
//                        isArith = true;
//                        result_c = left_c + right_c;
//                        break;
//                    case "-":
//                        isArith = true;
//                        result_c = left_c - right_c;
//                        break;
//                    case "*":
//                        isArith = true;
//                        result_c = left_c * right_c;
//                        break;
//                    case "/":
//                        isArith = true;
//                        result_c = left_c / right_c;
//                        break;
//                    case "%":
//                        isArith = true;
//                        result_c = left_c % right_c;
//                        break;
//                    case "<<":
//                        isArith = true;
//                        result_c = left_c << right_c;
//                        break;
//                    case ">>":
//                        isArith = true;
//                        result_c = left_c >> right_c;
//                        break;
//                    case ">>>":
//                        isArith = true;
//                        result_c = left_c >>> right_c;
//                        break;
//                    case "<":
//                        isArith = true;
//                        result_c = left_c < right_c;
//                        break;
//                    case ">":
//                        isArith = true;
//                        result_c = left_c > right_c;
//                        break;
//                    case "<=":
//                        isArith = true;
//                        result_c = left_c <= right_c;
//                        break;
//                    case ">=":
//                        isArith = true;
//                        result_c = left_c >= right_c;
//                        break;
//                    case "==":
//                        result_c = left_c == right_c;
//                        break;
//                    case "!=":
//                        result_c = left_c != right_c;
//                        break;
//                    case "===":
//                        result_c = left_c === right_c;
//                        break;
//                    case "!==":
//                        result_c = left_c !== right_c;
//                        break;
//                    case "&":
//                        isArith = true;
//                        result_c = left_c & right_c;
//                        break;
//                    case "|":
//                        isArith = true;
//                        result_c = left_c | right_c;
//                        break;
//                    case "^":
//                        isArith = true;
//                        result_c = left_c ^ right_c;
//                        break;
//                    case "instanceof":
//                        result_c = left_c instanceof right_c;
//                        if (rrEngine) {
//                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
//                        }
//                        break;
//                    case "delete":
//                        result_c = delete left_c[right_c];
//                        if (rrEngine) {
//                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
//                        }
//                        break;
//                    case "in":
//                        result_c = left_c in right_c;
//                        if (rrEngine) {
//                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
//                        }
//                        break;
//                    case "&&":
//                        result_c = left_c && right_c;
//                        break;
//                    case "||":
//                        result_c = left_c || right_c;
//                        break;
//                    case "regexin":
//                        result_c = right_c.test(left_c);
//                        break;
//                    default:
//                        throw new Error(op + " at " + iid + " not found");
//                        break;
//                }
//
//                if (rrEngine) {
//                    var type1 = typeof left_c;
//                    var type2 = typeof right_c;
//                    var flag1 = (type1 === "object" || type1 === "function") && !(left_c instanceof String) && !(left_c instanceof Number) && !(left_c instanceof Boolean)
//                    var flag2 = (type2 === "object" || type2 === "function") && !(right_c instanceof String) && !(right_c instanceof Number) && !(right_c instanceof Boolean)
//                    if (isArith && (flag1 || flag2)) {
//                        //console.log(" type1 "+type1+" type2 "+type2+" op "+op+ " iid "+iid);
//                        result_c = rrEngine.RR_L(iid, result_c, N_LOG_OPERATION);
//                    }
//                }
//                if (sandbox.analysis && sandbox.analysis.binary) {
//                    try {
//                        result_c = sandbox.analysis.binary(iid, op, left, right, result_c);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(result_c);
//                    }
//                }
//                return result_c;
//            }
//
//
//            // Unary operation
//            function U(iid, op, left) {
//                var left_c, result_c, isArith = false;
//
//                if (sandbox.analysis && sandbox.analysis.unaryPre) {
//                    try {
//                        sandbox.analysis.unaryPre(iid, op, left);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                left_c = getConcrete(left);
//
//                switch (op) {
//                    case "+":
//                        isArith = true;
//                        result_c = +left_c;
//                        break;
//                    case "-":
//                        isArith = true;
//                        result_c = -left_c;
//                        break;
//                    case "~":
//                        isArith = true;
//                        result_c = ~left_c;
//                        break;
//                    case "!":
//                        result_c = !left_c;
//                        break;
//                    case "typeof":
//                        result_c = typeof left_c;
//                        break;
//                    default:
//                        throw new Error(op + " at " + iid + " not found");
//                        break;
//                }
//
//                if (rrEngine) {
//                    var type1 = typeof left_c;
//                    var flag1 = (type1 === "object" || type1 === "function") && !(left_c instanceof String) && !(left_c instanceof Number) && !(left_c instanceof Boolean)
//                    if (isArith && flag1) {
//                        result_c = rrEngine.RR_L(iid, result_c, N_LOG_OPERATION);
//                    }
//                }
//                if (sandbox.analysis && sandbox.analysis.unary) {
//                    try {
//                        result_c = sandbox.analysis.unary(iid, op, left, result_c);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(result_c);
//                    }
//                }
//                return result_c;
//            }
//
//            function pushSwitchKey() {
//                switchKeyStack.push(switchLeft);
//            }
//
//            function popSwitchKey() {
//                switchLeft = switchKeyStack.pop();
//            }
//
//            function last() {
//                return lastVal;
//            }
//
//            // Switch key
//            // E.g., for 'switch (x) { ... }',
//            // C1 is invoked with value of x
//            function C1(iid, left) {
//                var left_c;
//
//                left_c = getConcrete(left);
//                switchLeft = left;
//                return left_c;
//            }
//
//            // case label inside switch
//            function C2(iid, left) {
//                var left_c, ret;
//
//                left_c = getConcrete(left);
//                left = B(iid, "===", switchLeft, left);
//
//                if (sandbox.analysis && sandbox.analysis.conditionalPre) {
//                    try {
//                        sandbox.analysis.conditionalPre(iid, left);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                ret = !! getConcrete(left);
//
//                if (sandbox.analysis && sandbox.analysis.conditional) {
//                    try {
//                        sandbox.analysis.conditional(iid, left, ret);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                if (branchCoverageInfo) {
//                    branchCoverageInfo.updateBranchInfo(iid, ret);
//                }
//                printValueForTesting("J$.C2", iid, left_c ? 1 : 0);
//                return left_c;
//            };
//
//            // Expression in conditional
//            function C(iid, left) {
//                var left_c, ret;
//                if (sandbox.analysis && sandbox.analysis.conditionalPre) {
//                    try {
//                        sandbox.analysis.conditionalPre(iid, left);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//
//                left_c = getConcrete(left);
//                ret = !! left_c;
//
//                if (sandbox.analysis && sandbox.analysis.conditional) {
//                    try {
//                        lastVal = sandbox.analysis.conditional(iid, left, left_c);
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                    if (rrEngine) {
//                        rrEngine.RR_updateRecordedObject(lastVal);
//                    }
//                } else {
//                    lastVal = left_c;
//                }
//
//                if (branchCoverageInfo) {
//                    branchCoverageInfo.updateBranchInfo(iid, ret);
//                }
//
//                printValueForTesting("J$.C ", iid, left_c ? 1 : 0);
//                return left_c;
//            }
//
//            function endExecution() {
//                if (branchCoverageInfo)
//                    branchCoverageInfo.storeBranchInfo();
//                if (Config.LOG_ALL_READS_AND_BRANCHES) {
//                    if (mode === MODE_REPLAY) {
//                        require('fs').writeFileSync("readAndBranchLogs.replay", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
//                    }
//                }
//
//                if (sandbox.analysis && sandbox.analysis.endExecution) {
//                    try {
//                        return sandbox.analysis.endExecution();
//                    } catch (e) {
//                        clientAnalysisException(e);
//                    }
//                }
//            }
//
//
//            //----------------------------------- End Jalangi Library backend ---------------------------------
//
//            // -------------------- Monkey patch some methods ------------------------
//            var GET_OWN_PROPERTY_NAMES = Object.getOwnPropertyNames;
//            Object.getOwnPropertyNames = function() {
//                var val = GET_OWN_PROPERTY_NAMES.apply(Object, arguments);
//                var idx = val.indexOf(SPECIAL_PROP);
//                if (idx > -1) {
//                    val.splice(idx, 1);
//                }
//                idx = val.indexOf(SPECIAL_PROP2);
//                if (idx > -1) {
//                    val.splice(idx, 1);
//                }
//                idx = val.indexOf(SPECIAL_PROP3);
//                if (idx > -1) {
//                    val.splice(idx, 1);
//                }
//                return val;
//            };
//
//
//            (function(console) {
//
//                console.save = function(data, filename) {
//
//                    if (!data) {
//                        console.error('Console.save: No data')
//                        return;
//                    }
//
//                    if (!filename) filename = 'console.json'
//
//                    if (typeof data === "object") {
//                        data = JSON.stringify(data, undefined, 4)
//                    }
//
//                    var blob = new Blob([data], {
//                        type: 'text/json'
//                    }),
//                        e = document.createEvent('MouseEvents'),
//                        a = document.createElement('a')
//
//                        a.download = filename
//                        a.href = window.URL.createObjectURL(blob)
//                        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
//                        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
//                        a.dispatchEvent(e)
//                }
//            })(console);
//
//
//            sandbox.U = U; // Unary operation
//            sandbox.B = B; // Binary operation
//            sandbox.C = C; // Condition
//            sandbox.C1 = C1; // Switch key
//            sandbox.C2 = C2; // case label C1 === C2
//            sandbox.addAxiom = addAxiom; // Add axiom
//            sandbox.getConcrete = getConcrete; // Get concrete value
//            sandbox._ = last; // Last value passed to C
//
//            sandbox.H = H; // hash in for-in
//            sandbox.I = I; // Ignore argument
//            sandbox.G = G; // getField
//            sandbox.P = P; // putField
//            sandbox.R = R; // Read
//            sandbox.W = W; // Write
//            sandbox.N = N; // Init
//            sandbox.T = T; // object/function/regexp/array Literal
//            sandbox.F = F; // Function call
//            sandbox.M = M; // Method call
//            sandbox.A = A; // Modify and assign +=, -= ...
//            sandbox.Fe = Fe; // Function enter
//            sandbox.Fr = Fr; // Function return
//            sandbox.Se = Se; // Script enter
//            sandbox.Sr = Sr; // Script return
//            sandbox.Rt = Rt; // returned value
//            sandbox.Ra = Ra;
//            sandbox.Ex = Ex;
//
//            sandbox.replay = rrEngine ? rrEngine.RR_replay : undefined;
//            sandbox.onflush = rrEngine ? rrEngine.onflush : function() {};
//            sandbox.record = rrEngine ? rrEngine.record : function() {};
//            sandbox.command = rrEngine ? rrEngine.command : function() {};
//            sandbox.endExecution = endExecution;
//            sandbox.addRecord = rrEngine ? rrEngine.addRecord : undefined;
//            sandbox.setTraceFileName = rrEngine ? rrEngine.setTraceFileName : undefined;
//        }
//    }
//
//
//    if (Constants.isBrowser) {
//        init(window.JALANGI_MODE, undefined, window.USE_SMEMORY);
//    } else { // node.js
//        init(global.JALANGI_MODE, global.ANALYSIS_SCRIPT, global.USE_SMEMORY);
//    }
//
//})(J$);


//@todo:@assumption arguments.callee is available
//@todo:@assumptions SPECIAL_PROP = "*J$*" is added to every object, but its enumeration is avoided in instrumented code
//@todo:@assumptions ReferenceError when accessing an undeclared uninitialized variable won't be thrown
//@todo:@assumption window.x is not initialized in node.js replay mode when var x = e is done in the global scope, but handled using syncValues
//@todo:@assumption eval is not renamed
//@todo: with needs to be handled
//@todo: new Function and setTimeout
//@todo: @assumption implicit call of toString and valueOf on objects during type conversion
// could lead to inaccurate replay if the object fields are not synchronized
//@todo: @assumption JSON.stringify of any float could be inaccurate, so logging could be inaccurate
//@todo: implicit type conversion from objects/arrays/functions during binary and unary operations could break record/replay



// change line: 1 to line: 8 in node_modules/source-map/lib/source-map/source-node.js
(function(b) {
    function a(b, d) {
        if ({}.hasOwnProperty.call(a.cache, b)) return a.cache[b];
        var e = a.resolve(b);
        if (!e) throw new Error('Failed to resolve module ' + b);
        var c = {
            id: b,
            require: a,
            filename: b,
            exports: {},
            loaded: !1,
            parent: d,
            children: []
        };
        d && d.children.push(c);
        var f = b.slice(0, b.lastIndexOf('/') + 1);
        return a.cache[b] = c.exports, e.call(c.exports, c, c.exports, f, b), c.loaded = !0, a.cache[b] = c.exports
    }
    a.modules = {}, a.cache = {}, a.resolve = function(b) {
        return {}.hasOwnProperty.call(a.modules, b) ? a.modules[b] : void 0
    }, a.define = function(b, c) {
        a.modules[b] = c
    };
    var c = function(a) {
        return a = '/', {
            title: 'browser',
            version: 'v0.10.26',
            browser: !0,
            env: {},
            argv: [],
            nextTick: b.setImmediate || function(a) {
                setTimeout(a, 0)
            },
            cwd: function() {
                return a
            },
            chdir: function(b) {
                a = b
            }
        }
    }();
    a.define('/tools/entry-point.js', function(c, d, e, f) {
        ! function() {
            'use strict';
            b.escodegen = a('/escodegen.js', c), escodegen.browser = !0
        }()
    }), a.define('/escodegen.js', function(d, c, e, f) {
        ! function(e, f, a0, D, _, q, B, l, y, v, K, Z, I, X, j, h, J, N, F, T, o, L, w, S, R) {
            'use strict';

            function a5(a) {
                switch (a.type) {
                    case e.AssignmentExpression:
                    case e.ArrayExpression:
                    case e.ArrayPattern:
                    case e.BinaryExpression:
                    case e.CallExpression:
                    case e.ConditionalExpression:
                    case e.ClassExpression:
                    case e.ExportBatchSpecifier:
                    case e.ExportSpecifier:
                    case e.FunctionExpression:
                    case e.Identifier:
                    case e.ImportSpecifier:
                    case e.Literal:
                    case e.LogicalExpression:
                    case e.MemberExpression:
                    case e.MethodDefinition:
                    case e.NewExpression:
                    case e.ObjectExpression:
                    case e.ObjectPattern:
                    case e.Property:
                    case e.SequenceExpression:
                    case e.ThisExpression:
                    case e.UnaryExpression:
                    case e.UpdateExpression:
                    case e.YieldExpression:
                        return !0
                }
                return !1
            }

            function ah(a) {
                switch (a.type) {
                    case e.BlockStatement:
                    case e.BreakStatement:
                    case e.CatchClause:
                    case e.ContinueStatement:
                    case e.ClassDeclaration:
                    case e.ClassBody:
                    case e.DirectiveStatement:
                    case e.DoWhileStatement:
                    case e.DebuggerStatement:
                    case e.EmptyStatement:
                    case e.ExpressionStatement:
                    case e.ForStatement:
                    case e.ForInStatement:
                    case e.ForOfStatement:
                    case e.FunctionDeclaration:
                    case e.IfStatement:
                    case e.LabeledStatement:
                    case e.ModuleDeclaration:
                    case e.Program:
                    case e.ReturnStatement:
                    case e.SwitchStatement:
                    case e.SwitchCase:
                    case e.ThrowStatement:
                    case e.TryStatement:
                    case e.VariableDeclaration:
                    case e.VariableDeclarator:
                    case e.WhileStatement:
                    case e.WithStatement:
                        return !0
                }
                return !1
            }

            function P() {
                return {
                    indent: null,
                    base: null,
                    parse: null,
                    comment: !1,
                    format: {
                        indent: {
                            style: '    ',
                            base: 0,
                            adjustMultilineComment: !1
                        },
                        newline: '\n',
                        space: ' ',
                        json: !1,
                        renumber: !1,
                        hexadecimal: !1,
                        quotes: 'single',
                        escapeless: !1,
                        compact: !1,
                        parentheses: !0,
                        semicolons: !0,
                        safeConcatenation: !1
                    },
                    moz: {
                        comprehensionExpressionStartsWithAssignment: !1,
                        starlessGenerator: !1
                    },
                    sourceMap: null,
                    sourceMapRoot: null,
                    sourceMapWithCode: !1,
                    directive: !1,
                    raw: !0,
                    verbatim: null
                }
            }

            function M(b, a) {
                var c = '';
                for (a |= 0; a > 0; a >>>= 1, b += b) a & 1 && (c += b);
                return c
            }

            function a6(a) {
                return /[\r\n]/g.test(a)
            }

            function p(b) {
                var a = b.length;
                return a && q.code.isLineTerminator(b.charCodeAt(a - 1))
            }

            function G(b, d) {
                function e(a) {
                    return typeof a === 'object' && a instanceof Object && !(a instanceof RegExp)
                }
                var a, c;
                for (a in d) d.hasOwnProperty(a) && (c = d[a], e(c) ? e(b[a]) ? G(b[a], c) : b[a] = G({}, c) : b[a] = c);
                return b
            }

            function a3(c) {
                var b, e, a, f, d;
                if (c !== c) throw new Error('Numeric literal whose value is NaN');
                if (c < 0 || c === 0 && 1 / c < 0) throw new Error('Numeric literal whose value is negative');
                if (c === 1 / 0) return v ? 'null' : K ? '1e400' : '1e+400';
                if (b = '' + c, !K || b.length < 3) return b;
                e = b.indexOf('.'), !v && b.charCodeAt(0) === 48 && e === 1 && (e = 0, b = b.slice(1)), a = b, b = b.replace('e+', 'e'), f = 0, (d = a.indexOf('e')) > 0 && (f = +a.slice(d + 1), a = a.slice(0, d)), e >= 0 && (f -= a.length - e - 1, a = +(a.slice(0, e) + a.slice(e + 1)) + ''), d = 0;
                while (a.charCodeAt(a.length + d - 1) === 48)--d;
                return d !== 0 && (f -= d, a = a.slice(0, d)), f !== 0 && (a += 'e' + f), (a.length < b.length || Z && c > 1e12 && Math.floor(c) === c && (a = '0x' + c.toString(16)).length < b.length) && +a === c && (b = a), b
            }

            function V(a, b) {
                return (a & -2) === 8232 ? (b ? 'u' : '\\u') + (a === 8232 ? '2028' : '2029') : a === 10 || a === 13 ? (b ? '' : '\\') + (a === 10 ? 'n' : 'r') : String.fromCharCode(a)
            }

            function a1(d) {
                var g, a, h, e, i, b, f, c;
                if (a = d.toString(), d.source) {
                    if (g = a.match(/\/([^/]*)$/), !g) return a;
                    for (h = g[1], a = '', f = !1, c = !1, e = 0, i = d.source.length; e < i; ++e) b = d.source.charCodeAt(e), c ? (a += V(b, c), c = !1) : (f ? b === 93 && (f = !1) : b === 47 ? a += '\\' : b === 91 && (f = !0), a += V(b, c), c = b === 92);
                    return '/' + a + '/' + h
                }
                return a
            }

            function a8(b, d) {
                var c, a = '\\';
                switch (b) {
                    case 8:
                        a += 'b';
                        break;
                    case 12:
                        a += 'f';
                        break;
                    case 9:
                        a += 't';
                        break;
                    default:
                        c = b.toString(16).toUpperCase();
                        v || b > 255 ? a += 'u' + '0000'.slice(c.length) + c : b === 0 && !q.code.isDecimalDigit(d) ? a += '0' : b === 11 ? a += 'x0B' : a += 'x' + '00'.slice(c.length) + c;
                        break
                }
                return a
            }

            function ad(b) {
                var a = '\\';
                switch (b) {
                    case 92:
                        a += '\\';
                        break;
                    case 10:
                        a += 'n';
                        break;
                    case 13:
                        a += 'r';
                        break;
                    case 8232:
                        a += 'u2028';
                        break;
                    case 8233:
                        a += 'u2029';
                        break;
                    default:
                        throw new Error('Incorrectly classified character')
                }
                return a
            }

            function ae(d) {
                var a, e, c, b;
                for (b = I === 'double' ? '"' : "'", a = 0, e = d.length; a < e; ++a) {
                    if (c = d.charCodeAt(a), c === 39) {
                        b = '"';
                        break
                    }
                    if (c === 34) {
                        b = "'";
                        break
                    }
                    c === 92 && ++a
                }
                return b + d + b
            }

            function af(d) {
                var b = '',
                    c, g, a, h = 0,
                    i = 0,
                    e, f;
                for (c = 0, g = d.length; c < g; ++c) {
                    if (a = d.charCodeAt(c), a === 39)++h;
                    else if (a === 34)++i;
                    else if (a === 47 && v) b += '\\';
                    else if (q.code.isLineTerminator(a) || a === 92) {
                        b += ad(a);
                        continue
                    } else if (v && a < 32 || !(v || X || a >= 32 && a <= 126)) {
                        b += a8(a, d.charCodeAt(c + 1));
                        continue
                    }
                    b += String.fromCharCode(a)
                }
                if (e = !(I === 'double' || I === 'auto' && i < h), f = e ? "'" : '"', !(e ? h : i)) return f + b + f;
                for (d = b, b = f, c = 0, g = d.length; c < g; ++c) a = d.charCodeAt(c), (a === 39 && e || a === 34 && !e) && (b += '\\'), b += String.fromCharCode(a);
                return b + f
            }

            function O(d) {
                var a, e, b, c = '';
                for (a = 0, e = d.length; a < e; ++a) b = d[a], c += B(b) ? O(b) : b;
                return c
            }

            function k(b, a) {
                if (!w) return B(b) ? O(b) : b;
                if (a == null)
                    if (b instanceof D) return b;
                    else a = {};
                return a.loc == null ? new D(null, null, w, b, a.name || null) : new D(a.loc.start.line, a.loc.start.column, w === !0 ? a.loc.source || null : w, b, a.name || null)
            }

            function s() {
                return h ? h : ' '
            }

            function i(c, d) {
                var e, f, a, b;
                return e = k(c).toString(), e.length === 0 ? [d] : (f = k(d).toString(), f.length === 0 ? [c] : (a = e.charCodeAt(e.length - 1), b = f.charCodeAt(0), (a === 43 || a === 45) && a === b || q.code.isIdentifierPart(a) && q.code.isIdentifierPart(b) || a === 47 && b === 105 ? [c, s(), d] : q.code.isWhiteSpace(a) || q.code.isLineTerminator(a) || q.code.isWhiteSpace(b) || q.code.isLineTerminator(b) ? [c, d] : [c, h, d]))
            }

            function u(a) {
                return [l, a]
            }

            function n(c) {
                var a, b;
                return a = l, l += y, b = c.call(this, l), l = a, b
            }

            function a9(b) {
                var a;
                for (a = b.length - 1; a >= 0; --a)
                    if (q.code.isLineTerminator(b.charCodeAt(a))) break;
                return b.length - 1 - a
            }

            function ac(j, i) {
                var b, a, e, g, d, c, f, h;
                for (b = j.split(/\r\n|[\r\n]/), c = Number.MAX_VALUE, a = 1, e = b.length; a < e; ++a) {
                    g = b[a], d = 0;
                    while (d < g.length && q.code.isWhiteSpace(g.charCodeAt(d)))++d;
                    c > d && (c = d)
                }
                for (i !== void 0 ? (f = l, b[1][c] === '*' && (i += ' '), l = i) : (c & 1 && --c, f = l), a = 1, e = b.length; a < e; ++a) h = k(u(b[a].slice(c))), b[a] = w ? h.join('') : h;
                return l = f, b.join('\n')
            }

            function H(a, b) {
                return a.type === 'Line' ? p(a.value) ? '//' + a.value : '//' + a.value + '\n' : o.format.indent.adjustMultilineComment && /[\n\r]/.test(a.value) ? ac('/*' + a.value + '*/', b) : '/*' + a.value + '*/'
            }

            function Q(b, a) {
                var c, f, d, i, j, h, g;
                if (b.leadingComments && b.leadingComments.length > 0) {
                    for (i = a, d = b.leadingComments[0], a = [], F && b.type === e.Program && b.body.length === 0 && a.push('\n'), a.push(H(d)), p(k(a).toString()) || a.push('\n'), c = 1, f = b.leadingComments.length; c < f; ++c) d = b.leadingComments[c], g = [H(d)], p(k(g).toString()) || g.push('\n'), a.push(u(g));
                    a.push(u(i))
                }
                if (b.trailingComments)
                    for (j = !p(k(a).toString()), h = M(' ', a9(k([l, a, y]).toString())), c = 0, f = b.trailingComments.length; c < f; ++c) d = b.trailingComments[c], j ? (c === 0 ? a = [a, y] : a = [a, h], a.push(H(d, h))) : a = [a, u(H(d))], c !== f - 1 && !p(k(a).toString()) && (a = [a, '\n']);
                return a
            }

            function r(a, b, c) {
                return b < c ? ['(', a, ')'] : a
            }

            function t(a, f, c) {
                var d, b;
                return b = !o.comment || !a.leadingComments, a.type === e.BlockStatement && b ? [h, m(a, {
                    functionBody: c
                })] : a.type === e.EmptyStatement && b ? ';' : (n(function() {
                    d = [j, u(m(a, {
                        semicolonOptional: f,
                        functionBody: c
                    }))]
                }), d)
            }

            function z(c, a) {
                var b = p(k(a).toString());
                return c.type === e.BlockStatement && !(o.comment && c.leadingComments) && !b ? [a, h] : b ? [a, l] : [a, j, l]
            }

            function U(d) {
                var a, c, b;
                for (b = d.split(/\r\n|\n/), a = 1, c = b.length; a < c; a++) b[a] = j + l + b[a];
                return b
            }

            function a4(c, d) {
                var a, b, e;
                return a = c[o.verbatim], typeof a === 'string' ? b = r(U(a), f.Sequence, d.precedence) : (b = U(a.content), e = a.precedence != null ? a.precedence : f.Sequence, b = r(b, e, d.precedence)), k(b, c)
            }

            function A(a) {
                return k(a.name, a)
            }

            function W(a, c) {
                var b;
                return a.type === e.Identifier ? b = A(a) : b = g(a, {
                    precedence: c.precedence,
                    allowIn: c.allowIn,
                    allowCall: !0
                }), b
            }

            function a7(a) {
                var c, d, b, g;
                if (g = !1, a.type === e.ArrowFunctionExpression && !a.rest && (!a.defaults || a.defaults.length === 0) && a.params.length === 1 && a.params[0].type === e.Identifier) b = [A(a.params[0])];
                else {
                    for (b = ['('], a.defaults && (g = !0), c = 0, d = a.params.length; c < d; ++c) g && a.defaults[c] ? b.push($(a.params[c], a.defaults[c], '=', {
                        precedence: f.Assignment,
                        allowIn: !0,
                        allowCall: !0
                    })) : b.push(W(a.params[c], {
                        precedence: f.Assignment,
                        allowIn: !0,
                        allowCall: !0
                    })), c + 1 < d && b.push(',' + h);
                    a.rest && (a.params.length && b.push(',' + h), b.push('...'), b.push(A(a.rest, {
                        precedence: f.Assignment,
                        allowIn: !0,
                        allowCall: !0
                    }))), b.push(')')
                }
                return b
            }

            function x(b) {
                var a, c;
                return a = a7(b), b.type === e.ArrowFunctionExpression && (a.push(h), a.push('=>')), b.expression ? (a.push(h), c = g(b.body, {
                    precedence: f.Assignment,
                    allowIn: !0,
                    allowCall: !0
                }), c.toString().charAt(0) === '{' && (c = ['(', c, ')']), a.push(c)) : a.push(t(b.body, !1, !0)), a
            }

            function Y(c, b, d) {
                var a = ['for' + h + '('];
                return n(function() {
                    b.left.type === e.VariableDeclaration ? n(function() {
                        a.push(b.left.kind + s()), a.push(m(b.left.declarations[0], {
                            allowIn: !1
                        }))
                    }) : a.push(g(b.left, {
                        precedence: f.Call,
                        allowIn: !0,
                        allowCall: !0
                    })), a = i(a, c), a = [i(a, g(b.right, {
                        precedence: f.Sequence,
                        allowIn: !0,
                        allowCall: !0
                    })), ')']
                }), a.push(t(b.body, d)), a
            }

            function aa(c, i, d) {
                function f() {
                    for (b = c.declarations[0], o.comment && b.leadingComments ? (a.push('\n'), a.push(u(m(b, {
                        allowIn: d
                    })))) : (a.push(s()), a.push(m(b, {
                        allowIn: d
                    }))), e = 1, g = c.declarations.length; e < g; ++e) b = c.declarations[e], o.comment && b.leadingComments ? (a.push(',' + j), a.push(u(m(b, {
                        allowIn: d
                    })))) : (a.push(',' + h), a.push(m(b, {
                        allowIn: d
                    })))
                }
                var a, e, g, b;
                return a = [c.kind], c.declarations.length > 1 ? n(f) : f(), a.push(i), a
            }

            function ab(b) {
                var a = ['{', j];
                return n(function(h) {
                    var c, d;
                    for (c = 0, d = b.body.length; c < d; ++c) a.push(h), a.push(g(b.body[c], {
                        precedence: f.Sequence,
                        allowIn: !0,
                        allowCall: !0,
                        type: e.Property
                    })), c + 1 < d && a.push(j)
                }), p(k(a).toString()) || a.push(j), a.push(l), a.push('}'), a
            }

            function E(a) {
                var b;
                if (a.hasOwnProperty('raw') && L && o.raw) try {
                    if (b = L(a.raw).body[0].expression, b.type === e.Literal && b.value === a.value) return a.raw
                } catch (a) {}
                return a.value === null ? 'null' : typeof a.value === 'string' ? af(a.value) : typeof a.value === 'number' ? a3(a.value) : typeof a.value === 'boolean' ? a.value ? 'true' : 'false' : a1(a.value)
            }

            function C(c, b, d) {
                var a = [];
                return b && a.push('['), a.push(g(c, d)), b && a.push(']'), a
            }

            function $(d, e, i, c) {
                var a, b;
                return b = c.precedence, a = c.allowIn || f.Assignment < b, r([g(d, {
                    precedence: f.Call,
                    allowIn: a,
                    allowCall: !0
                }), h + i + h, g(e, {
                    precedence: f.Assignment,
                    allowIn: a,
                    allowCall: !0
                })], f.Assignment, b)
            }

            function g(b, y) {
                var a, v, G, B, d, t, c, u, D, z, I, w, F, K, H, L;
                if (v = y.precedence, w = y.allowIn, F = y.allowCall, G = b.type || y.type, o.verbatim && b.hasOwnProperty(o.verbatim)) return a4(b, y);
                switch (G) {
                    case e.SequenceExpression:
                        a = [];
                        w |= f.Sequence < v;
                        for (d = 0, t = b.expressions.length; d < t; ++d) a.push(g(b.expressions[d], {
                            precedence: f.Assignment,
                            allowIn: w,
                            allowCall: !0
                        })), d + 1 < t && a.push(',' + h);
                        a = r(a, f.Sequence, v);
                        break;
                    case e.AssignmentExpression:
                        a = $(b.left, b.right, b.operator, y);
                        break;
                    case e.ArrowFunctionExpression:
                        w |= f.ArrowFunction < v;
                        a = r(x(b), f.ArrowFunction, v);
                        break;
                    case e.ConditionalExpression:
                        w |= f.Conditional < v;
                        a = r([g(b.test, {
                            precedence: f.LogicalOR,
                            allowIn: w,
                            allowCall: !0
                        }), h + '?' + h, g(b.consequent, {
                            precedence: f.Assignment,
                            allowIn: w,
                            allowCall: !0
                        }), h + ':' + h, g(b.alternate, {
                            precedence: f.Assignment,
                            allowIn: w,
                            allowCall: !0
                        })], f.Conditional, v);
                        break;
                    case e.LogicalExpression:
                    case e.BinaryExpression:
                        B = a0[b.operator];
                        w |= B < v;
                        c = g(b.left, {
                            precedence: B,
                            allowIn: w,
                            allowCall: !0
                        });
                        z = c.toString();
                        z.charCodeAt(z.length - 1) === 47 && q.code.isIdentifierPart(b.operator.charCodeAt(0)) ? a = [c, s(), b.operator] : a = i(c, b.operator);
                        c = g(b.right, {
                            precedence: B + 1,
                            allowIn: w,
                            allowCall: !0
                        });
                        b.operator === '/' && c.toString().charAt(0) === '/' || b.operator.slice(-1) === '<' && c.toString().slice(0, 3) === '!--' ? (a.push(s()), a.push(c)) : a = i(a, c);
                        b.operator === 'in' && !w ? a = ['(', a, ')'] : a = r(a, B, v);
                        break;
                    case e.CallExpression:
                        a = [g(b.callee, {
                            precedence: f.Call,
                            allowIn: !0,
                            allowCall: !0,
                            allowUnparenthesizedNew: !1
                        })];
                        a.push('(');
                        for (d = 0, t = b['arguments'].length; d < t; ++d) a.push(g(b['arguments'][d], {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        })), d + 1 < t && a.push(',' + h);
                        a.push(')');
                        F ? a = r(a, f.Call, v) : a = ['(', a, ')'];
                        break;
                    case e.NewExpression:
                        t = b['arguments'].length;
                        K = y.allowUnparenthesizedNew === undefined || y.allowUnparenthesizedNew;
                        a = i('new', g(b.callee, {
                            precedence: f.New,
                            allowIn: !0,
                            allowCall: !1,
                            allowUnparenthesizedNew: K && !J && t === 0
                        }));
                        if (!K || J || t > 0) {
                            for (a.push('('), d = 0; d < t; ++d) a.push(g(b['arguments'][d], {
                                precedence: f.Assignment,
                                allowIn: !0,
                                allowCall: !0
                            })), d + 1 < t && a.push(',' + h);
                            a.push(')')
                        }
                        a = r(a, f.New, v);
                        break;
                    case e.MemberExpression:
                        a = [g(b.object, {
                            precedence: f.Call,
                            allowIn: !0,
                            allowCall: F,
                            allowUnparenthesizedNew: !1
                        })];
                        b.computed ? (a.push('['), a.push(g(b.property, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: F
                        })), a.push(']')) : (b.object.type === e.Literal && typeof b.object.value === 'number' && (c = k(a).toString(), c.indexOf('.') < 0 && !/[eExX]/.test(c) && q.code.isDecimalDigit(c.charCodeAt(c.length - 1)) && !(c.length >= 2 && c.charCodeAt(0) === 48) && a.push('.')), a.push('.'), a.push(A(b.property)));
                        a = r(a, f.Member, v);
                        break;
                    case e.UnaryExpression:
                        c = g(b.argument, {
                            precedence: f.Unary,
                            allowIn: !0,
                            allowCall: !0
                        });
                        h === '' ? a = i(b.operator, c) : (a = [b.operator], b.operator.length > 2 ? a = i(a, c) : (z = k(a).toString(), D = z.charCodeAt(z.length - 1), I = c.toString().charCodeAt(0), (D === 43 || D === 45) && D === I || q.code.isIdentifierPart(D) && q.code.isIdentifierPart(I) ? (a.push(s()), a.push(c)) : a.push(c)));
                        a = r(a, f.Unary, v);
                        break;
                    case e.YieldExpression:
                        b.delegate ? a = 'yield*' : a = 'yield';
                        b.argument && (a = i(a, g(b.argument, {
                            precedence: f.Yield,
                            allowIn: !0,
                            allowCall: !0
                        })));
                        a = r(a, f.Yield, v);
                        break;
                    case e.UpdateExpression:
                        b.prefix ? a = r([b.operator, g(b.argument, {
                            precedence: f.Unary,
                            allowIn: !0,
                            allowCall: !0
                        })], f.Unary, v) : a = r([g(b.argument, {
                            precedence: f.Postfix,
                            allowIn: !0,
                            allowCall: !0
                        }), b.operator], f.Postfix, v);
                        break;
                    case e.FunctionExpression:
                        L = b.generator && !o.moz.starlessGenerator;
                        a = L ? 'function*' : 'function';
                        b.id ? a = [a, L ? h : s(), A(b.id), x(b)] : a = [a + h, x(b)];
                        break;
                    case e.ExportBatchSpecifier:
                        a = '*';
                        break;
                    case e.ArrayPattern:
                    case e.ArrayExpression:
                        if (!b.elements.length) {
                            a = '[]';
                            break
                        }
                        u = b.elements.length > 1;
                        a = ['[', u ? j : ''];
                        n(function(c) {
                            for (d = 0, t = b.elements.length; d < t; ++d) b.elements[d] ? (a.push(u ? c : ''), a.push(g(b.elements[d], {
                                precedence: f.Assignment,
                                allowIn: !0,
                                allowCall: !0
                            }))) : (u && a.push(c), d + 1 === t && a.push(',')), d + 1 < t && a.push(',' + (u ? j : h))
                        });
                        u && !p(k(a).toString()) && a.push(j);
                        a.push(u ? l : '');
                        a.push(']');
                        break;
                    case e.ClassExpression:
                        a = ['class'];
                        b.id && (a = i(a, g(b.id, {
                            allowIn: !0,
                            allowCall: !0
                        })));
                        b.superClass && (c = i('extends', g(b.superClass, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        })), a = i(a, c));
                        a.push(h);
                        a.push(m(b.body, {
                            semicolonOptional: !0,
                            directiveContext: !1
                        }));
                        break;
                    case e.MethodDefinition:
                        b['static'] ? a = ['static' + h] : a = [];
                        b.kind === 'get' || b.kind === 'set' ? a = i(a, [i(b.kind, C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })), x(b.value)]) : (c = [C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }), x(b.value)], b.value.generator ? (a.push('*'), a.push(c)) : a = i(a, c));
                        break;
                    case e.Property:
                        b.kind === 'get' || b.kind === 'set' ? a = [b.kind, s(), C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }), x(b.value)] : b.shorthand ? a = C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }) : b.method ? (a = [], b.value.generator && a.push('*'), a.push(C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })), a.push(x(b.value))) : a = [C(b.key, b.computed, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }), ':' + h, g(b.value, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        })];
                        break;
                    case e.ObjectExpression:
                        if (!b.properties.length) {
                            a = '{}';
                            break
                        }
                        u = b.properties.length > 1;
                        n(function() {
                            c = g(b.properties[0], {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0,
                                type: e.Property
                            })
                        });
                        if (!(u || a6(k(c).toString()))) {
                            a = ['{', h, c, h, '}'];
                            break
                        }
                        n(function(h) {
                            if (a = ['{', j, h, c], u)
                                for (a.push(',' + j), d = 1, t = b.properties.length; d < t; ++d) a.push(h), a.push(g(b.properties[d], {
                                    precedence: f.Sequence,
                                    allowIn: !0,
                                    allowCall: !0,
                                    type: e.Property
                                })), d + 1 < t && a.push(',' + j)
                        });
                        p(k(a).toString()) || a.push(j);
                        a.push(l);
                        a.push('}');
                        break;
                    case e.ObjectPattern:
                        if (!b.properties.length) {
                            a = '{}';
                            break
                        }
                        u = !1;
                        if (b.properties.length === 1) H = b.properties[0], H.value.type !== e.Identifier && (u = !0);
                        else
                            for (d = 0, t = b.properties.length; d < t; ++d)
                                if (H = b.properties[d], !H.shorthand) {
                                    u = !0;
                                    break
                                } a = ['{', u ? j : ''];
                        n(function(c) {
                            for (d = 0, t = b.properties.length; d < t; ++d) a.push(u ? c : ''), a.push(g(b.properties[d], {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            })), d + 1 < t && a.push(',' + (u ? j : h))
                        });
                        u && !p(k(a).toString()) && a.push(j);
                        a.push(u ? l : '');
                        a.push('}');
                        break;
                    case e.ThisExpression:
                        a = 'this';
                        break;
                    case e.Identifier:
                        a = A(b);
                        break;
                    case e.ImportSpecifier:
                    case e.ExportSpecifier:
                        a = [b.id.name];
                        b.name && a.push(s() + 'as' + s() + b.name.name);
                        break;
                    case e.Literal:
                        a = E(b);
                        break;
                    case e.GeneratorExpression:
                    case e.ComprehensionExpression:
                        a = G === e.GeneratorExpression ? ['('] : ['['];
                        o.moz.comprehensionExpressionStartsWithAssignment && (c = g(b.body, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        }), a.push(c));
                        b.blocks && n(function() {
                            for (d = 0, t = b.blocks.length; d < t; ++d) c = g(b.blocks[d], {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), d > 0 || o.moz.comprehensionExpressionStartsWithAssignment ? a = i(a, c) : a.push(c)
                        });
                        b.filter && (a = i(a, 'if' + h), c = g(b.filter, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }), a = i(a, ['(', c, ')']));
                        o.moz.comprehensionExpressionStartsWithAssignment || (c = g(b.body, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        }), a = i(a, c));
                        a.push(G === e.GeneratorExpression ? ')' : ']');
                        break;
                    case e.ComprehensionBlock:
                        b.left.type === e.VariableDeclaration ? c = [b.left.kind, s(), m(b.left.declarations[0], {
                            allowIn: !1
                        })] : c = g(b.left, {
                            precedence: f.Call,
                            allowIn: !0,
                            allowCall: !0
                        });
                        c = i(c, b.of ? 'of' : 'in');
                        c = i(c, g(b.right, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }));
                        a = ['for' + h + '(', c, ')'];
                        break;
                    case e.SpreadElement:
                        a = ['...', g(b.argument, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        })];
                        break;
                    case e.TaggedTemplateExpression:
                        a = [g(b.tag, {
                            precedence: f.Call,
                            allowIn: !0,
                            allowCall: F,
                            allowUnparenthesizedNew: !1
                        }), g(b.quasi, {
                            precedence: f.Primary
                        })];
                        a = r(a, f.TaggedTemplate, v);
                        break;
                    case e.TemplateElement:
                        a = b.value.raw;
                        break;
                    case e.TemplateLiteral:
                        a = ['`'];
                        for (d = 0, t = b.quasis.length; d < t; ++d) a.push(g(b.quasis[d], {
                            precedence: f.Primary,
                            allowIn: !0,
                            allowCall: !0
                        })), d + 1 < t && (a.push('${' + h), a.push(g(b.expressions[d], {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })), a.push(h + '}'));
                        a.push('`');
                        break;
                    default:
                        throw new Error('Unknown expression type: ' + b.type)
                }
                return o.comment && (a = Q(b, a)), k(a, b)
            }

            function ag(b, d) {
                var a, c;
                return b.specifiers.length === 0 ? ['import', h, E(b.source), d] : (a = ['import'], c = 0, b.specifiers[0]['default'] && (a = i(a, [b.specifiers[0].id.name]), ++c), b.specifiers[c] && (c !== 0 && a.push(','), a.push(h + '{'), b.specifiers.length - c === 1 ? (a.push(h), a.push(g(b.specifiers[c], {
                    precedence: f.Sequence,
                    allowIn: !0,
                    allowCall: !0
                })), a.push(h + '}' + h)) : (n(function(h) {
                    var d, e;
                    for (a.push(j), d = c, e = b.specifiers.length; d < e; ++d) a.push(h), a.push(g(b.specifiers[d], {
                        precedence: f.Sequence,
                        allowIn: !0,
                        allowCall: !0
                    })), d + 1 < e && a.push(',' + j)
                }), p(k(a).toString()) || a.push(j), a.push(l + '}' + h))), a = i(a, ['from' + h, E(b.source), d]), a)
            }

            function m(b, y) {
                var c, q, a, v, G, D, r, d, H, C;
                v = !0, d = ';', G = !1, D = !1, y && (v = y.allowIn === undefined || y.allowIn, !N && y.semicolonOptional === !0 && (d = ''), G = y.functionBody, D = y.directiveContext);
                switch (b.type) {
                    case e.BlockStatement:
                        a = ['{', j];
                        n(function() {
                            for (c = 0, q = b.body.length; c < q; ++c) r = u(m(b.body[c], {
                                semicolonOptional: c === q - 1,
                                directiveContext: G
                            })), a.push(r), p(k(r).toString()) || a.push(j)
                        });
                        a.push(u('}'));
                        break;
                    case e.BreakStatement:
                        b.label ? a = 'break ' + b.label.name + d : a = 'break' + d;
                        break;
                    case e.ContinueStatement:
                        b.label ? a = 'continue ' + b.label.name + d : a = 'continue' + d;
                        break;
                    case e.ClassBody:
                        a = ab(b);
                        break;
                    case e.ClassDeclaration:
                        a = ['class ' + b.id.name];
                        b.superClass && (r = i('extends', g(b.superClass, {
                            precedence: f.Assignment,
                            allowIn: !0,
                            allowCall: !0
                        })), a = i(a, r));
                        a.push(h);
                        a.push(m(b.body, {
                            semicolonOptional: !0,
                            directiveContext: !1
                        }));
                        break;
                    case e.DirectiveStatement:
                        o.raw && b.raw ? a = b.raw + d : a = ae(b.directive) + d;
                        break;
                    case e.DoWhileStatement:
                        a = i('do', t(b.body));
                        a = z(b.body, a);
                        a = i(a, ['while' + h + '(', g(b.test, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        }), ')' + d]);
                        break;
                    case e.CatchClause:
                        n(function() {
                            var c;
                            a = ['catch' + h + '(', g(b.param, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), ')'], b.guard && (c = g(b.guard, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), a.splice(2, 0, ' if ', c))
                        });
                        a.push(t(b.body));
                        break;
                    case e.DebuggerStatement:
                        a = 'debugger' + d;
                        break;
                    case e.EmptyStatement:
                        a = ';';
                        break;
                    case e.ExportDeclaration:
                        a = ['export'];
                        if (b['default']) {
                            a = i(a, 'default'), a = i(a, g(b.declaration, {
                                precedence: f.Assignment,
                                allowIn: !0,
                                allowCall: !0
                            }) + d);
                            break
                        }
                        if (b.specifiers) {
                            b.specifiers.length === 0 ? a = i(a, '{' + h + '}') : b.specifiers[0].type === e.ExportBatchSpecifier ? a = i(a, g(b.specifiers[0], {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            })) : (a = i(a, '{'), n(function(e) {
                                var c, d;
                                for (a.push(j), c = 0, d = b.specifiers.length; c < d; ++c) a.push(e), a.push(g(b.specifiers[c], {
                                    precedence: f.Sequence,
                                    allowIn: !0,
                                    allowCall: !0
                                })), c + 1 < d && a.push(',' + j)
                            }), p(k(a).toString()) || a.push(j), a.push(l + '}')), b.source ? a = i(a, ['from' + h, E(b.source), d]) : a.push(d);
                            break
                        }
                        b.declaration && (a = i(a, m(b.declaration, {
                            semicolonOptional: d === ''
                        })));
                        break;
                    case e.ExpressionStatement:
                        a = [g(b.expression, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })];
                        r = k(a).toString();
                        r.charAt(0) === '{' || r.slice(0, 5) === 'class' && ' {'.indexOf(r.charAt(5)) >= 0 || r.slice(0, 8) === 'function' && '* ('.indexOf(r.charAt(8)) >= 0 || T && D && b.expression.type === e.Literal && typeof b.expression.value === 'string' ? a = ['(', a, ')' + d] : a.push(d);
                        break;
                    case e.ImportDeclaration:
                        a = ag(b, d);
                        break;
                    case e.VariableDeclarator:
                        b.init ? a = [g(b.id, {
                            precedence: f.Assignment,
                            allowIn: v,
                            allowCall: !0
                        }), h, '=', h, g(b.init, {
                            precedence: f.Assignment,
                            allowIn: v,
                            allowCall: !0
                        })] : a = W(b.id, {
                            precedence: f.Assignment,
                            allowIn: v
                        });
                        break;
                    case e.VariableDeclaration:
                        a = aa(b, d, v);
                        break;
                    case e.ThrowStatement:
                        a = [i('throw', g(b.argument, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })), d];
                        break;
                    case e.TryStatement:
                        a = ['try', t(b.block)];
                        a = z(b.block, a);
                        if (b.handlers)
                            for (c = 0, q = b.handlers.length; c < q; ++c) a = i(a, m(b.handlers[c])), (b.finalizer || c + 1 !== q) && (a = z(b.handlers[c].body, a));
                        else {
                            for (C = b.guardedHandlers || [], c = 0, q = C.length; c < q; ++c) a = i(a, m(C[c])), (b.finalizer || c + 1 !== q) && (a = z(C[c].body, a));
                            if (b.handler)
                                if (B(b.handler))
                                    for (c = 0, q = b.handler.length; c < q; ++c) a = i(a, m(b.handler[c])), (b.finalizer || c + 1 !== q) && (a = z(b.handler[c].body, a));
                                else a = i(a, m(b.handler)), b.finalizer && (a = z(b.handler.body, a))
                        }
                        b.finalizer && (a = i(a, ['finally', t(b.finalizer)]));
                        break;
                    case e.SwitchStatement:
                        n(function() {
                            a = ['switch' + h + '(', g(b.discriminant, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), ')' + h + '{' + j]
                        });
                        if (b.cases)
                            for (c = 0, q = b.cases.length; c < q; ++c) r = u(m(b.cases[c], {
                                semicolonOptional: c === q - 1
                            })), a.push(r), p(k(r).toString()) || a.push(j);
                        a.push(u('}'));
                        break;
                    case e.SwitchCase:
                        n(function() {
                            for (b.test ? a = [i('case', g(b.test, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            })), ':'] : a = ['default:'], c = 0, q = b.consequent.length, q && b.consequent[0].type === e.BlockStatement && (r = t(b.consequent[0]), a.push(r), c = 1), c !== q && !p(k(a).toString()) && a.push(j); c < q; ++c) r = u(m(b.consequent[c], {
                                semicolonOptional: c === q - 1 && d === ''
                            })), a.push(r), c + 1 !== q && !p(k(r).toString()) && a.push(j)
                        });
                        break;
                    case e.IfStatement:
                        n(function() {
                            a = ['if' + h + '(', g(b.test, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), ')']
                        });
                        b.alternate ? (a.push(t(b.consequent)), a = z(b.consequent, a), b.alternate.type === e.IfStatement ? a = i(a, ['else ', m(b.alternate, {
                            semicolonOptional: d === ''
                        })]) : a = i(a, i('else', t(b.alternate, d === '')))) : a.push(t(b.consequent, d === ''));
                        break;
                    case e.ForStatement:
                        n(function() {
                            a = ['for' + h + '('], b.init ? b.init.type === e.VariableDeclaration ? a.push(m(b.init, {
                                allowIn: !1
                            })) : (a.push(g(b.init, {
                                precedence: f.Sequence,
                                allowIn: !1,
                                allowCall: !0
                            })), a.push(';')) : a.push(';'), b.test ? (a.push(h), a.push(g(b.test, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            })), a.push(';')) : a.push(';'), b.update ? (a.push(h), a.push(g(b.update, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            })), a.push(')')) : a.push(')')
                        });
                        a.push(t(b.body, d === ''));
                        break;
                    case e.ForInStatement:
                        a = Y('in', b, d === '');
                        break;
                    case e.ForOfStatement:
                        a = Y('of', b, d === '');
                        break;
                    case e.LabeledStatement:
                        a = [b.label.name + ':', t(b.body, d === '')];
                        break;
                    case e.ModuleDeclaration:
                        a = ['module', s(), b.id.name, s(), 'from', h, E(b.source), d];
                        break;
                    case e.Program:
                        q = b.body.length;
                        a = [F && q > 0 ? '\n' : ''];
                        for (c = 0; c < q; ++c) r = u(m(b.body[c], {
                            semicolonOptional: !F && c === q - 1,
                            directiveContext: !0
                        })), a.push(r), c + 1 < q && !p(k(r).toString()) && a.push(j);
                        break;
                    case e.FunctionDeclaration:
                        H = b.generator && !o.moz.starlessGenerator;
                        a = [H ? 'function*' : 'function', H ? h : s(), A(b.id), x(b)];
                        break;
                    case e.ReturnStatement:
                        b.argument ? a = [i('return', g(b.argument, {
                            precedence: f.Sequence,
                            allowIn: !0,
                            allowCall: !0
                        })), d] : a = ['return' + d];
                        break;
                    case e.WhileStatement:
                        n(function() {
                            a = ['while' + h + '(', g(b.test, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), ')']
                        });
                        a.push(t(b.body, d === ''));
                        break;
                    case e.WithStatement:
                        n(function() {
                            a = ['with' + h + '(', g(b.object, {
                                precedence: f.Sequence,
                                allowIn: !0,
                                allowCall: !0
                            }), ')']
                        });
                        a.push(t(b.body, d === ''));
                        break;
                    default:
                        throw new Error('Unknown statement type: ' + b.type)
                }
                return o.comment && (a = Q(b, a)), r = k(a).toString(), b.type === e.Program && !F && j === '' && r.charAt(r.length - 1) === '\n' && (a = w ? k(a).replaceRight(/\s+$/, '') : r.replace(/\s+$/, '')), k(a, b)
            }

            function ai(a) {
                if (ah(a)) return m(a);
                if (a5(a)) return g(a, {
                    precedence: f.Sequence,
                    allowIn: !0,
                    allowCall: !0
                });
                throw new Error('Unknown node type: ' + a.type)
            }

            function a2(k, e) {
                var g = P(),
                    i, f;
                return e != null ? (typeof e.indent === 'string' && (g.format.indent.style = e.indent), typeof e.base === 'number' && (g.format.indent.base = e.base), e = G(g, e), y = e.format.indent.style, typeof e.base === 'string' ? l = e.base : l = M(y, e.format.indent.base)) : (e = g, y = e.format.indent.style, l = M(y, e.format.indent.base)), v = e.format.json, K = e.format.renumber, Z = v ? !1 : e.format.hexadecimal, I = v ? 'double' : e.format.quotes, X = e.format.escapeless, j = e.format.newline, h = e.format.space, e.format.compact && (j = h = y = l = ''), J = e.format.parentheses, N = e.format.semicolons, F = e.format.safeConcatenation, T = e.directive, L = v ? null : e.parse, w = e.sourceMap, o = e, w && (c.browser ? D = b.sourceMap.SourceNode : D = a('/node_modules/source-map/lib/source-map.js', d).SourceNode), i = ai(k), w ? (f = i.toStringWithSourceMap({
                    file: e.file,
                    sourceRoot: e.sourceMapRoot
                }), e.sourceContent && f.map.setSourceContent(e.sourceMap, e.sourceContent), e.sourceMapWithCode ? f : f.map.toString()) : (f = {
                    code: i.toString(),
                    map: null
                }, e.sourceMapWithCode ? f : f.code)
            }
            _ = a('/node_modules/estraverse/estraverse.js', d), q = a('/node_modules/esutils/lib/utils.js', d), e = {
                AssignmentExpression: 'AssignmentExpression',
                ArrayExpression: 'ArrayExpression',
                ArrayPattern: 'ArrayPattern',
                ArrowFunctionExpression: 'ArrowFunctionExpression',
                BlockStatement: 'BlockStatement',
                BinaryExpression: 'BinaryExpression',
                BreakStatement: 'BreakStatement',
                CallExpression: 'CallExpression',
                CatchClause: 'CatchClause',
                ClassBody: 'ClassBody',
                ClassDeclaration: 'ClassDeclaration',
                ClassExpression: 'ClassExpression',
                ComprehensionBlock: 'ComprehensionBlock',
                ComprehensionExpression: 'ComprehensionExpression',
                ConditionalExpression: 'ConditionalExpression',
                ContinueStatement: 'ContinueStatement',
                DirectiveStatement: 'DirectiveStatement',
                DoWhileStatement: 'DoWhileStatement',
                DebuggerStatement: 'DebuggerStatement',
                EmptyStatement: 'EmptyStatement',
                ExportBatchSpecifier: 'ExportBatchSpecifier',
                ExportDeclaration: 'ExportDeclaration',
                ExportSpecifier: 'ExportSpecifier',
                ExpressionStatement: 'ExpressionStatement',
                ForStatement: 'ForStatement',
                ForInStatement: 'ForInStatement',
                ForOfStatement: 'ForOfStatement',
                FunctionDeclaration: 'FunctionDeclaration',
                FunctionExpression: 'FunctionExpression',
                GeneratorExpression: 'GeneratorExpression',
                Identifier: 'Identifier',
                IfStatement: 'IfStatement',
                ImportSpecifier: 'ImportSpecifier',
                ImportDeclaration: 'ImportDeclaration',
                Literal: 'Literal',
                LabeledStatement: 'LabeledStatement',
                LogicalExpression: 'LogicalExpression',
                MemberExpression: 'MemberExpression',
                MethodDefinition: 'MethodDefinition',
                ModuleDeclaration: 'ModuleDeclaration',
                NewExpression: 'NewExpression',
                ObjectExpression: 'ObjectExpression',
                ObjectPattern: 'ObjectPattern',
                Program: 'Program',
                Property: 'Property',
                ReturnStatement: 'ReturnStatement',
                SequenceExpression: 'SequenceExpression',
                SpreadElement: 'SpreadElement',
                SwitchStatement: 'SwitchStatement',
                SwitchCase: 'SwitchCase',
                TaggedTemplateExpression: 'TaggedTemplateExpression',
                TemplateElement: 'TemplateElement',
                TemplateLiteral: 'TemplateLiteral',
                ThisExpression: 'ThisExpression',
                ThrowStatement: 'ThrowStatement',
                TryStatement: 'TryStatement',
                UnaryExpression: 'UnaryExpression',
                UpdateExpression: 'UpdateExpression',
                VariableDeclaration: 'VariableDeclaration',
                VariableDeclarator: 'VariableDeclarator',
                WhileStatement: 'WhileStatement',
                WithStatement: 'WithStatement',
                YieldExpression: 'YieldExpression'
            }, f = {
                Sequence: 0,
                Yield: 1,
                Assignment: 1,
                Conditional: 2,
                ArrowFunction: 2,
                LogicalOR: 3,
                LogicalAND: 4,
                BitwiseOR: 5,
                BitwiseXOR: 6,
                BitwiseAND: 7,
                Equality: 8,
                Relational: 9,
                BitwiseSHIFT: 10,
                Additive: 11,
                Multiplicative: 12,
                Unary: 13,
                Postfix: 14,
                Call: 15,
                New: 16,
                TaggedTemplate: 17,
                Member: 18,
                Primary: 19
            }, a0 = {
                '||': f.LogicalOR,
                '&&': f.LogicalAND,
                '|': f.BitwiseOR,
                '^': f.BitwiseXOR,
                '&': f.BitwiseAND,
                '==': f.Equality,
                '!=': f.Equality,
                '===': f.Equality,
                '!==': f.Equality,
                is: f.Equality,
                isnt: f.Equality,
                '<': f.Relational,
                '>': f.Relational,
                '<=': f.Relational,
                '>=': f.Relational,
                'in': f.Relational,
                'instanceof': f.Relational,
                '<<': f.BitwiseSHIFT,
                '>>': f.BitwiseSHIFT,
                '>>>': f.BitwiseSHIFT,
                '+': f.Additive,
                '-': f.Additive,
                '*': f.Multiplicative,
                '%': f.Multiplicative,
                '/': f.Multiplicative
            }, B = Array.isArray, B || (B = function a(b) {
                return Object.prototype.toString.call(b) === '[object Array]'
            }), S = {
                indent: {
                    style: '',
                    base: 0
                },
                renumber: !0,
                hexadecimal: !0,
                quotes: 'auto',
                escapeless: !0,
                compact: !0,
                parentheses: !1,
                semicolons: !1
            }, R = P().format, c.version = a('/package.json', d).version, c.generate = a2, c.attachComments = _.attachComments, c.Precedence = G({}, f), c.browser = !1, c.FORMAT_MINIFY = S, c.FORMAT_DEFAULTS = R
        }()
    }), a.define('/package.json', function(a, b, c, d) {
        a.exports = {
            name: 'escodegen',
            description: 'ECMAScript code generator',
            homepage: 'http://github.com/Constellation/escodegen',
            main: 'escodegen.js',
            bin: {
                esgenerate: './bin/esgenerate.js',
                escodegen: './bin/escodegen.js'
            },
            version: '1.4.1',
            engines: {
                node: '>=0.10.0'
            },
            maintainers: [{
                name: 'Yusuke Suzuki',
                email: 'utatane.tea@gmail.com',
                web: 'http://github.com/Constellation'
            }],
            repository: {
                type: 'git',
                url: 'http://github.com/Constellation/escodegen.git'
            },
            dependencies: {
                estraverse: '^1.5.1',
                esutils: '^1.1.4',
                esprima: '^1.2.2'
            },
            optionalDependencies: {
                'source-map': '~0.1.37'
            },
            devDependencies: {
                'esprima-moz': '*',
                semver: '^3.0.1',
                bluebird: '^2.2.2',
                'jshint-stylish': '^0.4.0',
                chai: '^1.9.1',
                'gulp-mocha': '^1.0.0',
                'gulp-eslint': '^0.1.8',
                gulp: '^3.8.6',
                'bower-registry-client': '^0.2.1',
                'gulp-jshint': '^1.8.0',
                'commonjs-everywhere': '^0.9.7'
            },
            licenses: [{
                type: 'BSD',
                url: 'http://github.com/Constellation/escodegen/raw/master/LICENSE.BSD'
            }],
            scripts: {
                test: 'gulp travis',
                'unit-test': 'gulp test',
                lint: 'gulp lint',
                release: 'node tools/release.js',
                'build-min': './node_modules/.bin/cjsify -ma path: tools/entry-point.js > escodegen.browser.min.js',
                build: './node_modules/.bin/cjsify -a path: tools/entry-point.js > escodegen.browser.js'
            }
        }
    }), a.define('/node_modules/source-map/lib/source-map.js', function(b, c, d, e) {
        c.SourceMapGenerator = a('/node_modules/source-map/lib/source-map/source-map-generator.js', b).SourceMapGenerator, c.SourceMapConsumer = a('/node_modules/source-map/lib/source-map/source-map-consumer.js', b).SourceMapConsumer, c.SourceNode = a('/node_modules/source-map/lib/source-map/source-node.js', b).SourceNode
    }), a.define('/node_modules/source-map/lib/source-map/source-node.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(d, h, e) {
            function a(a, b, c, d, e) {
                this.children = [], this.sourceContents = {}, this.line = a == null ? null : a, this.column = b == null ? null : b, this.source = c == null ? null : c, this.name = e == null ? null : e, d != null && this.add(d)
            }
            var f = d('/node_modules/source-map/lib/source-map/source-map-generator.js', e).SourceMapGenerator,
                b = d('/node_modules/source-map/lib/source-map/util.js', e),
                c = /(\r?\n)/,
                g = /\r\n|[\s\S]/g;
            a.fromStringWithSourceMap = function d(n, m, j) {
                function l(c, d) {
                    if (c === null || c.source === undefined) f.add(d);
                    else {
                        var e = j ? b.join(j, c.source) : c.source;
                        f.add(new a(c.originalLine, c.originalColumn, e, d, c.name))
                    }
                }
                var f = new a,
                    e = n.split(c),
                    k = function() {
                        var a = e.shift(),
                            b = e.shift() || '';
                        return a + b
                    }, i = 1,
                    h = 0,
                    g = null;
                return m.eachMapping(function(a) {
                    if (g !== null)
                        if (i < a.generatedLine) {
                            var c = '';
                            l(g, k()), i++, h = 0
                        } else {
                            var b = e[0],
                                c = b.substr(0, a.generatedColumn - h);
                            e[0] = b.substr(a.generatedColumn - h), h = a.generatedColumn, l(g, c), g = a;
                            return
                        }
                    while (i < a.generatedLine) f.add(k()), i++;
                    if (h < a.generatedColumn) {
                        var b = e[0];
                        f.add(b.substr(0, a.generatedColumn)), e[0] = b.substr(a.generatedColumn), h = a.generatedColumn
                    }
                    g = a
                }, this), e.length > 0 && (g && l(g, k()), f.add(e.join(''))), m.sources.forEach(function(a) {
                    var c = m.sourceContentFor(a);
                    c != null && (j != null && (a = b.join(j, a)), f.setSourceContent(a, c))
                }), f
            }, a.prototype.add = function b(c) {
                if (Array.isArray(c)) c.forEach(function(a) {
                    this.add(a)
                }, this);
                else if (c instanceof a || typeof c === 'string') c && this.children.push(c);
                else throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + c);
                return this
            }, a.prototype.prepend = function b(c) {
                if (Array.isArray(c))
                    for (var d = c.length - 1; d >= 0; d--) this.prepend(c[d]);
                else if (c instanceof a || typeof c === 'string') this.children.unshift(c);
                else throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + c);
                return this
            }, a.prototype.walk = function b(e) {
                var c;
                for (var d = 0, f = this.children.length; d < f; d++) c = this.children[d], c instanceof a ? c.walk(e) : c !== '' && e(c, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                })
            }, a.prototype.join = function a(e) {
                var b, c, d = this.children.length;
                if (d > 0) {
                    for (b = [], c = 0; c < d - 1; c++) b.push(this.children[c]), b.push(e);
                    b.push(this.children[c]), this.children = b
                }
                return this
            }, a.prototype.replaceRight = function b(d, e) {
                var c = this.children[this.children.length - 1];
                return c instanceof a ? c.replaceRight(d, e) : typeof c === 'string' ? this.children[this.children.length - 1] = c.replace(d, e) : this.children.push(''.replace(d, e)), this
            }, a.prototype.setSourceContent = function a(c, d) {
                this.sourceContents[b.toSetString(c)] = d
            }, a.prototype.walkSourceContents = function c(g) {
                for (var d = 0, e = this.children.length; d < e; d++) this.children[d] instanceof a && this.children[d].walkSourceContents(g);
                var f = Object.keys(this.sourceContents);
                for (var d = 0, e = f.length; d < e; d++) g(b.fromSetString(f[d]), this.sourceContents[f[d]])
            }, a.prototype.toString = function a() {
                var b = '';
                return this.walk(function(a) {
                    b += a
                }), b
            }, a.prototype.toStringWithSourceMap = function a(l) {
                var b = {
                    code: '',
                    line: 1,
                    column: 0
                }, d = new f(l),
                    e = !1,
                    h = null,
                    i = null,
                    j = null,
                    k = null;
                return this.walk(function(f, a) {
                    b.code += f, a.source !== null && a.line !== null && a.column !== null ? ((h !== a.source || i !== a.line || j !== a.column || k !== a.name) && d.addMapping({
                        source: a.source,
                        original: {
                            line: a.line,
                            column: a.column
                        },
                        generated: {
                            line: b.line,
                            column: b.column
                        },
                        name: a.name
                    }), h = a.source, i = a.line, j = a.column, k = a.name, e = !0) : e && (d.addMapping({
                        generated: {
                            line: b.line,
                            column: b.column
                        }
                    }), h = null, e = !1), f.match(g).forEach(function(f, g, i) {
                        c.test(f) ? (b.line++, b.column = 0, g + 1 === i.length ? (h = null, e = !1) : e && d.addMapping({
                            source: a.source,
                            original: {
                                line: a.line,
                                column: a.column
                            },
                            generated: {
                                line: b.line,
                                column: b.column
                            },
                            name: a.name
                        })) : b.column += f.length
                    })
                }), this.walkSourceContents(function(a, b) {
                    d.setSourceContent(a, b)
                }), {
                    code: b.code,
                    map: d
                }
            }, h.SourceNode = a
        })
    }), a.define('/node_modules/source-map/lib/source-map/util.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(o, a, p) {
            function m(b, a, c) {
                if (a in b) return b[a];
                else if (arguments.length === 3) return c;
                else throw new Error('"' + a + '" is a required argument.')
            }

            function b(b) {
                var a = b.match(f);
                return a ? {
                    scheme: a[1],
                    auth: a[2],
                    host: a[3],
                    port: a[4],
                    path: a[5]
                } : null
            }

            function c(a) {
                var b = '';
                return a.scheme && (b += a.scheme + ':'), b += '//', a.auth && (b += a.auth + '@'), a.host && (b += a.host), a.port && (b += ':' + a.port), a.path && (b += a.path), b
            }

            function g(i) {
                var a = i,
                    d = b(i);
                if (d) {
                    if (!d.path) return i;
                    a = d.path
                }
                var j = a.charAt(0) === '/',
                    e = a.split(/\/+/);
                for (var h, g = 0, f = e.length - 1; f >= 0; f--) h = e[f], h === '.' ? e.splice(f, 1) : h === '..' ? g++ : g > 0 && (h === '' ? (e.splice(f + 1, g), g = 0) : (e.splice(f, 2), g--));
                return a = e.join('/'), a === '' && (a = j ? '/' : '.'), d ? (d.path = a, c(d)) : a
            }

            function h(h, d) {
                h === '' && (h = '.'), d === '' && (d = '.');
                var f = b(d),
                    a = b(h);
                if (a && (h = a.path || '/'), f && !f.scheme) return a && (f.scheme = a.scheme), c(f);
                if (f || d.match(e)) return d;
                if (a && !a.host && !a.path) return a.host = d, c(a);
                var i = d.charAt(0) === '/' ? d : g(h.replace(/\/+$/, '') + '/' + d);
                return a ? (a.path = i, c(a)) : i
            }

            function j(a, c) {
                a === '' && (a = '.'), a = a.replace(/\/$/, '');
                var d = b(a);
                return c.charAt(0) == '/' && d && d.path == '/' ? c.slice(1) : c.indexOf(a + '/') === 0 ? c.substr(a.length + 1) : c
            }

            function k(a) {
                return '$' + a
            }

            function l(a) {
                return a.substr(1)
            }

            function d(c, d) {
                var a = c || '',
                    b = d || '';
                return (a > b) - (a < b)
            }

            function n(b, c, e) {
                var a;
                return a = d(b.source, c.source), a ? a : (a = b.originalLine - c.originalLine, a ? a : (a = b.originalColumn - c.originalColumn, a || e ? a : (a = d(b.name, c.name), a ? a : (a = b.generatedLine - c.generatedLine, a ? a : b.generatedColumn - c.generatedColumn))))
            }

            function i(b, c, e) {
                var a;
                return a = b.generatedLine - c.generatedLine, a ? a : (a = b.generatedColumn - c.generatedColumn, a || e ? a : (a = d(b.source, c.source), a ? a : (a = b.originalLine - c.originalLine, a ? a : (a = b.originalColumn - c.originalColumn, a ? a : d(b.name, c.name)))))
            }
            a.getArg = m;
            var f = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/,
                e = /^data:.+\,.+$/;
            a.urlParse = b, a.urlGenerate = c, a.normalize = g, a.join = h, a.relative = j, a.toSetString = k, a.fromSetString = l, a.compareByOriginalPositions = n, a.compareByGeneratedPositions = i
        })
    }), a.define('/node_modules/source-map/node_modules/amdefine/amdefine.js', function(b, f, g, d) {
        'use strict';

        function e(e, i) {
            'use strict';

            function q(b) {
                var a, c;
                for (a = 0; b[a]; a += 1)
                    if (c = b[a], c === '.') b.splice(a, 1), a -= 1;
                    else if (c === '..')
                    if (a === 1 && (b[2] === '..' || b[0] === '..')) break;
                    else a > 0 && (b.splice(a - 1, 2), a -= 2)
            }

            function j(b, c) {
                var a;
                return b && b.charAt(0) === '.' && c && (a = c.split('/'), a = a.slice(0, a.length - 1), a = a.concat(b.split('/')), q(a), b = a.join('/')), b
            }

            function p(a) {
                return function(b) {
                    return j(b, a)
                }
            }

            function o(c) {
                function a(a) {
                    b[c] = a
                }
                return a.fromText = function(a, b) {
                    throw new Error('amdefine does not implement load.fromText')
                }, a
            }

            function m(c, h, l) {
                var m, f, a, j;
                if (c) f = b[c] = {}, a = {
                    id: c,
                    uri: d,
                    exports: f
                }, m = g(i, f, a, c);
                else {
                    if (k) throw new Error('amdefine with no module ID cannot be called more than once per file.');
                    k = !0, f = e.exports, a = e, m = g(i, f, a, e.id)
                }
                h && (h = h.map(function(a) {
                    return m(a)
                })), typeof l === 'function' ? j = l.apply(a.exports, h) : j = l, j !== undefined && (a.exports = j, c && (b[c] = a.exports))
            }

            function l(b, a, c) {
                Array.isArray(b) ? (c = a, a = b, b = undefined) : typeof b !== 'string' && (c = b, b = a = undefined), a && !Array.isArray(a) && (c = a, a = undefined), a || (a = ['require', 'exports', 'module']), b ? f[b] = [b, a, c] : m(b, a, c)
            }
            var f = {}, b = {}, k = !1,
                n = a('path', e),
                g, h;
            return g = function(b, d, a, e) {
                function f(f, g) {
                    if (typeof f === 'string') return h(b, d, a, f, e);
                    f = f.map(function(c) {
                        return h(b, d, a, c, e)
                    }), c.nextTick(function() {
                        g.apply(null, f)
                    })
                }
                return f.toUrl = function(b) {
                    return b.indexOf('.') === 0 ? j(b, n.dirname(a.filename)) : b
                }, f
            }, i = i || function a() {
                return e.require.apply(e, arguments)
            }, h = function(d, e, i, a, c) {
                var k = a.indexOf('!'),
                    n = a,
                    q, l;
                if (k === -1)
                    if (a = j(a, c), a === 'require') return g(d, e, i, c);
                    else if (a === 'exports') return e;
                else if (a === 'module') return i;
                else if (b.hasOwnProperty(a)) return b[a];
                else if (f[a]) return m.apply(null, f[a]), b[a];
                else if (d) return d(n);
                else throw new Error('No module with ID: ' + a);
                else return q = a.substring(0, k), a = a.substring(k + 1, a.length), l = h(d, e, i, q, c), l.normalize ? a = l.normalize(a, p(c)) : a = j(a, c), b[a] ? b[a] : (l.load(a, g(d, e, i, c), o(a), {}), b[a])
            }, l.require = function(a) {
                return b[a] ? b[a] : f[a] ? (m.apply(null, f[a]), b[a]) : void 0
            }, l.amd = {}, l
        }
        b.exports = e
    }), a.define('/node_modules/source-map/lib/source-map/source-map-generator.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(e, g, f) {
            function b(b) {
                b || (b = {}), this._file = a.getArg(b, 'file', null), this._sourceRoot = a.getArg(b, 'sourceRoot', null), this._sources = new d, this._names = new d, this._mappings = [], this._sourcesContents = null
            }
            var c = e('/node_modules/source-map/lib/source-map/base64-vlq.js', f),
                a = e('/node_modules/source-map/lib/source-map/util.js', f),
                d = e('/node_modules/source-map/lib/source-map/array-set.js', f).ArraySet;
            b.prototype._version = 3, b.fromSourceMap = function c(d) {
                var e = d.sourceRoot,
                    f = new b({
                        file: d.file,
                        sourceRoot: e
                    });
                return d.eachMapping(function(b) {
                    var c = {
                        generated: {
                            line: b.generatedLine,
                            column: b.generatedColumn
                        }
                    };
                    b.source != null && (c.source = b.source, e != null && (c.source = a.relative(e, c.source)), c.original = {
                        line: b.originalLine,
                        column: b.originalColumn
                    }, b.name != null && (c.name = b.name)), f.addMapping(c)
                }), d.sources.forEach(function(b) {
                    var a = d.sourceContentFor(b);
                    a != null && f.setSourceContent(b, a)
                }), f
            }, b.prototype.addMapping = function b(f) {
                var g = a.getArg(f, 'generated'),
                    c = a.getArg(f, 'original', null),
                    d = a.getArg(f, 'source', null),
                    e = a.getArg(f, 'name', null);
                this._validateMapping(g, c, d, e), d != null && !this._sources.has(d) && this._sources.add(d), e != null && !this._names.has(e) && this._names.add(e), this._mappings.push({
                    generatedLine: g.line,
                    generatedColumn: g.column,
                    originalLine: c != null && c.line,
                    originalColumn: c != null && c.column,
                    source: d,
                    name: e
                })
            }, b.prototype.setSourceContent = function b(e, d) {
                var c = e;
                this._sourceRoot != null && (c = a.relative(this._sourceRoot, c)), d != null ? (this._sourcesContents || (this._sourcesContents = {}), this._sourcesContents[a.toSetString(c)] = d) : (delete this._sourcesContents[a.toSetString(c)], Object.keys(this._sourcesContents).length === 0 && (this._sourcesContents = null))
            }, b.prototype.applySourceMap = function b(e, j, g) {
                var f = j;
                if (j == null) {
                    if (e.file == null) throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map\'s "file" property. Both were omitted.');
                    f = e.file
                }
                var c = this._sourceRoot;
                c != null && (f = a.relative(c, f));
                var h = new d,
                    i = new d;
                this._mappings.forEach(function(b) {
                    if (b.source === f && b.originalLine != null) {
                        var d = e.originalPositionFor({
                            line: b.originalLine,
                            column: b.originalColumn
                        });
                        d.source != null && (b.source = d.source, g != null && (b.source = a.join(g, b.source)), c != null && (b.source = a.relative(c, b.source)), b.originalLine = d.line, b.originalColumn = d.column, d.name != null && b.name != null && (b.name = d.name))
                    }
                    var j = b.source;
                    j != null && !h.has(j) && h.add(j);
                    var k = b.name;
                    k != null && !i.has(k) && i.add(k)
                }, this), this._sources = h, this._names = i, e.sources.forEach(function(b) {
                    var d = e.sourceContentFor(b);
                    d != null && (g != null && (b = a.join(g, b)), c != null && (b = a.relative(c, b)), this.setSourceContent(b, d))
                }, this)
            }, b.prototype._validateMapping = function a(b, c, d, e) {
                if (b && 'line' in b && 'column' in b && b.line > 0 && b.column >= 0 && !c && !d && !e) return;
                else if (b && 'line' in b && 'column' in b && c && 'line' in c && 'column' in c && b.line > 0 && b.column >= 0 && c.line > 0 && c.column >= 0 && d) return;
                else throw new Error('Invalid mapping: ' + JSON.stringify({
                    generated: b,
                    source: d,
                    original: c,
                    name: e
                }))
            }, b.prototype._serializeMappings = function b() {
                var h = 0,
                    g = 1,
                    j = 0,
                    k = 0,
                    i = 0,
                    l = 0,
                    e = '',
                    d;
                this._mappings.sort(a.compareByGeneratedPositions);
                for (var f = 0, m = this._mappings.length; f < m; f++) {
                    if (d = this._mappings[f], d.generatedLine !== g) {
                        h = 0;
                        while (d.generatedLine !== g) e += ';', g++
                    } else if (f > 0) {
                        if (!a.compareByGeneratedPositions(d, this._mappings[f - 1])) continue;
                        e += ','
                    }
                    e += c.encode(d.generatedColumn - h), h = d.generatedColumn, d.source != null && (e += c.encode(this._sources.indexOf(d.source) - l), l = this._sources.indexOf(d.source), e += c.encode(d.originalLine - 1 - k), k = d.originalLine - 1, e += c.encode(d.originalColumn - j), j = d.originalColumn, d.name != null && (e += c.encode(this._names.indexOf(d.name) - i), i = this._names.indexOf(d.name)))
                }
                return e
            }, b.prototype._generateSourcesContent = function b(d, c) {
                return d.map(function(b) {
                    if (!this._sourcesContents) return null;
                    c != null && (b = a.relative(c, b));
                    var d = a.toSetString(b);
                    return Object.prototype.hasOwnProperty.call(this._sourcesContents, d) ? this._sourcesContents[d] : null
                }, this)
            }, b.prototype.toJSON = function a() {
                var b = {
                    version: this._version,
                    sources: this._sources.toArray(),
                    names: this._names.toArray(),
                    mappings: this._serializeMappings()
                };
                return this._file != null && (b.file = this._file), this._sourceRoot != null && (b.sourceRoot = this._sourceRoot), this._sourcesContents && (b.sourcesContent = this._generateSourcesContent(b.sources, b.sourceRoot)), b
            }, b.prototype.toString = function a() {
                return JSON.stringify(this)
            }, g.SourceMapGenerator = b
        })
    }), a.define('/node_modules/source-map/lib/source-map/array-set.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(c, d, e) {
            function a() {
                this._array = [], this._set = {}
            }
            var b = c('/node_modules/source-map/lib/source-map/util.js', e);
            a.fromArray = function b(e, g) {
                var d = new a;
                for (var c = 0, f = e.length; c < f; c++) d.add(e[c], g);
                return d
            }, a.prototype.add = function a(c, f) {
                var d = this.has(c),
                    e = this._array.length;
                (!d || f) && this._array.push(c), d || (this._set[b.toSetString(c)] = e)
            }, a.prototype.has = function a(c) {
                return Object.prototype.hasOwnProperty.call(this._set, b.toSetString(c))
            }, a.prototype.indexOf = function a(c) {
                if (this.has(c)) return this._set[b.toSetString(c)];
                throw new Error('"' + c + '" is not in the set.')
            }, a.prototype.at = function a(b) {
                if (b >= 0 && b < this._array.length) return this._array[b];
                throw new Error('No element indexed by ' + b)
            }, a.prototype.toArray = function a() {
                return this._array.slice()
            }, d.ArraySet = a
        })
    }), a.define('/node_modules/source-map/lib/source-map/base64-vlq.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(j, f, h) {
            function i(a) {
                return a < 0 ? (-a << 1) + 1 : (a << 1) + 0
            }

            function g(b) {
                var c = (b & 1) === 1,
                    a = b >> 1;
                return c ? -a : a
            }
            var c = j('/node_modules/source-map/lib/source-map/base64.js', h),
                a = 5,
                d = 1 << a,
                e = d - 1,
                b = d;
            f.encode = function d(j) {
                var g = '',
                    h, f = i(j);
                do h = f & e, f >>>= a, f > 0 && (h |= b), g += c.encode(h); while (f > 0);
                return g
            }, f.decode = function d(i) {
                var f = 0,
                    l = i.length,
                    j = 0,
                    k = 0,
                    m, h;
                do {
                    if (f >= l) throw new Error('Expected more digits in base 64 VLQ value.');
                    h = c.decode(i.charAt(f++)), m = !! (h & b), h &= e, j += h << k, k += a
                } while (m);
                return {
                    value: g(j),
                    rest: i.slice(f)
                }
            }
        })
    }), a.define('/node_modules/source-map/lib/source-map/base64.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(d, c, e) {
            var a = {}, b = {};
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function(c, d) {
                a[c] = d, b[d] = c
            }), c.encode = function a(c) {
                if (c in b) return b[c];
                throw new TypeError('Must be between 0 and 63: ' + c)
            }, c.decode = function b(c) {
                if (c in a) return a[c];
                throw new TypeError('Not a valid base 64 digit: ' + c)
            }
        })
    }), a.define('/node_modules/source-map/lib/source-map/source-map-consumer.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(e, h, f) {
            function b(c) {
                var b = c;
                typeof c === 'string' && (b = JSON.parse(c.replace(/^\)\]\}'/, '')));
                var e = a.getArg(b, 'version'),
                    f = a.getArg(b, 'sources'),
                    g = a.getArg(b, 'names', []),
                    h = a.getArg(b, 'sourceRoot', null),
                    i = a.getArg(b, 'sourcesContent', null),
                    j = a.getArg(b, 'mappings'),
                    k = a.getArg(b, 'file', null);
                if (e != this._version) throw new Error('Unsupported version: ' + e);
                this._names = d.fromArray(g, !0), this._sources = d.fromArray(f, !0), this.sourceRoot = h, this.sourcesContent = i, this._mappings = j, this.file = k
            }
            var a = e('/node_modules/source-map/lib/source-map/util.js', f),
                g = e('/node_modules/source-map/lib/source-map/binary-search.js', f),
                d = e('/node_modules/source-map/lib/source-map/array-set.js', f).ArraySet,
                c = e('/node_modules/source-map/lib/source-map/base64-vlq.js', f);
            b.fromSourceMap = function c(f) {
                var e = Object.create(b.prototype);
                return e._names = d.fromArray(f._names.toArray(), !0), e._sources = d.fromArray(f._sources.toArray(), !0), e.sourceRoot = f._sourceRoot, e.sourcesContent = f._generateSourcesContent(e._sources.toArray(), e.sourceRoot), e.file = f._file, e.__generatedMappings = f._mappings.slice().sort(a.compareByGeneratedPositions), e.__originalMappings = f._mappings.slice().sort(a.compareByOriginalPositions), e
            }, b.prototype._version = 3, Object.defineProperty(b.prototype, 'sources', {
                get: function() {
                    return this._sources.toArray().map(function(b) {
                        return this.sourceRoot != null ? a.join(this.sourceRoot, b) : b
                    }, this)
                }
            }), b.prototype.__generatedMappings = null, Object.defineProperty(b.prototype, '_generatedMappings', {
                get: function() {
                    return this.__generatedMappings || (this.__generatedMappings = [], this.__originalMappings = [], this._parseMappings(this._mappings, this.sourceRoot)), this.__generatedMappings
                }
            }), b.prototype.__originalMappings = null, Object.defineProperty(b.prototype, '_originalMappings', {
                get: function() {
                    return this.__originalMappings || (this.__generatedMappings = [], this.__originalMappings = [], this._parseMappings(this._mappings, this.sourceRoot)), this.__originalMappings
                }
            }), b.prototype._parseMappings = function b(n, o) {
                var j = 1,
                    h = 0,
                    i = 0,
                    m = 0,
                    k = 0,
                    l = 0,
                    g = /^[,;]/,
                    d = n,
                    f, e;
                while (d.length > 0)
                    if (d.charAt(0) === ';') j++, d = d.slice(1), h = 0;
                    else if (d.charAt(0) === ',') d = d.slice(1);
                else {
                    if (f = {}, f.generatedLine = j, e = c.decode(d), f.generatedColumn = h + e.value, h = f.generatedColumn, d = e.rest, d.length > 0 && !g.test(d.charAt(0))) {
                        if (e = c.decode(d), f.source = this._sources.at(k + e.value), k += e.value, d = e.rest, d.length === 0 || g.test(d.charAt(0))) throw new Error('Found a source, but no line and column');
                        if (e = c.decode(d), f.originalLine = i + e.value, i = f.originalLine, f.originalLine += 1, d = e.rest, d.length === 0 || g.test(d.charAt(0))) throw new Error('Found a source and line, but no column');
                        e = c.decode(d), f.originalColumn = m + e.value, m = f.originalColumn, d = e.rest, d.length > 0 && !g.test(d.charAt(0)) && (e = c.decode(d), f.name = this._names.at(l + e.value), l += e.value, d = e.rest)
                    }
                    this.__generatedMappings.push(f), typeof f.originalLine === 'number' && this.__originalMappings.push(f)
                }
                this.__generatedMappings.sort(a.compareByGeneratedPositions), this.__originalMappings.sort(a.compareByOriginalPositions)
            }, b.prototype._findMapping = function a(b, e, c, d, f) {
                if (b[c] <= 0) throw new TypeError('Line must be greater than or equal to 1, got ' + b[c]);
                if (b[d] < 0) throw new TypeError('Column must be greater than or equal to 0, got ' + b[d]);
                return g.search(b, e, f)
            }, b.prototype.originalPositionFor = function b(f) {
                var e = {
                    generatedLine: a.getArg(f, 'line'),
                    generatedColumn: a.getArg(f, 'column')
                }, c = this._findMapping(e, this._generatedMappings, 'generatedLine', 'generatedColumn', a.compareByGeneratedPositions);
                if (c && c.generatedLine === e.generatedLine) {
                    var d = a.getArg(c, 'source', null);
                    return d != null && this.sourceRoot != null && (d = a.join(this.sourceRoot, d)), {
                        source: d,
                        line: a.getArg(c, 'originalLine', null),
                        column: a.getArg(c, 'originalColumn', null),
                        name: a.getArg(c, 'name', null)
                    }
                }
                return {
                    source: null,
                    line: null,
                    column: null,
                    name: null
                }
            }, b.prototype.sourceContentFor = function b(c) {
                if (!this.sourcesContent) return null;
                if (this.sourceRoot != null && (c = a.relative(this.sourceRoot, c)), this._sources.has(c)) return this.sourcesContent[this._sources.indexOf(c)];
                var d;
                if (this.sourceRoot != null && (d = a.urlParse(this.sourceRoot))) {
                    var e = c.replace(/^file:\/\//, '');
                    if (d.scheme == 'file' && this._sources.has(e)) return this.sourcesContent[this._sources.indexOf(e)];
                    if ((!d.path || d.path == '/') && this._sources.has('/' + c)) return this.sourcesContent[this._sources.indexOf('/' + c)]
                }
                throw new Error('"' + c + '" is not in the SourceMap.')
            }, b.prototype.generatedPositionFor = function b(e) {
                var c = {
                    source: a.getArg(e, 'source'),
                    originalLine: a.getArg(e, 'line'),
                    originalColumn: a.getArg(e, 'column')
                };
                this.sourceRoot != null && (c.source = a.relative(this.sourceRoot, c.source));
                var d = this._findMapping(c, this._originalMappings, 'originalLine', 'originalColumn', a.compareByOriginalPositions);
                return d ? {
                    line: a.getArg(d, 'generatedLine', null),
                    column: a.getArg(d, 'generatedColumn', null)
                } : {
                    line: null,
                    column: null
                }
            }, b.GENERATED_ORDER = 1, b.ORIGINAL_ORDER = 2, b.prototype.eachMapping = function c(h, i, j) {
                var f = i || null,
                    g = j || b.GENERATED_ORDER,
                    d;
                switch (g) {
                    case b.GENERATED_ORDER:
                        d = this._generatedMappings;
                        break;
                    case b.ORIGINAL_ORDER:
                        d = this._originalMappings;
                        break;
                    default:
                        throw new Error('Unknown order of iteration.')
                }
                var e = this.sourceRoot;
                d.map(function(b) {
                    var c = b.source;
                    return c != null && e != null && (c = a.join(e, c)), {
                        source: c,
                        generatedLine: b.generatedLine,
                        generatedColumn: b.generatedColumn,
                        originalLine: b.originalLine,
                        originalColumn: b.originalColumn,
                        name: b.name
                    }
                }).forEach(h, f)
            }, h.SourceMapConsumer = b
        })
    }), a.define('/node_modules/source-map/lib/source-map/binary-search.js', function(c, d, e, f) {
        if (typeof b !== 'function') var b = a('/node_modules/source-map/node_modules/amdefine/amdefine.js', c)(c, a);
        b(function(c, b, d) {
            function a(c, e, f, d, g) {
                var b = Math.floor((e - c) / 2) + c,
                    h = g(f, d[b], !0);
                return h === 0 ? d[b] : h > 0 ? e - b > 1 ? a(b, e, f, d, g) : d[b] : b - c > 1 ? a(c, b, f, d, g) : c < 0 ? null : d[c]
            }
            b.search = function b(d, c, e) {
                return c.length > 0 ? a(-1, c.length, d, c, e) : null
            }
        })
    }), a.define('/node_modules/esutils/lib/utils.js', function(b, c, d, e) {
        ! function() {
            'use strict';
            c.ast = a('/node_modules/esutils/lib/ast.js', b), c.code = a('/node_modules/esutils/lib/code.js', b), c.keyword = a('/node_modules/esutils/lib/keyword.js', b)
        }()
    }), a.define('/node_modules/esutils/lib/keyword.js', function(b, c, d, e) {
        ! function(d) {
            'use strict';

            function i(a) {
                switch (a) {
                    case 'implements':
                    case 'interface':
                    case 'package':
                    case 'private':
                    case 'protected':
                    case 'public':
                    case 'static':
                    case 'let':
                        return !0;
                    default:
                        return !1
                }
            }

            function g(a, b) {
                return !b && a === 'yield' ? !1 : c(a, b)
            }

            function c(a, b) {
                if (b && i(a)) return !0;
                switch (a.length) {
                    case 2:
                        return a === 'if' || a === 'in' || a === 'do';
                    case 3:
                        return a === 'var' || a === 'for' || a === 'new' || a === 'try';
                    case 4:
                        return a === 'this' || a === 'else' || a === 'case' || a === 'void' || a === 'with' || a === 'enum';
                    case 5:
                        return a === 'while' || a === 'break' || a === 'catch' || a === 'throw' || a === 'const' || a === 'yield' || a === 'class' || a === 'super';
                    case 6:
                        return a === 'return' || a === 'typeof' || a === 'delete' || a === 'switch' || a === 'export' || a === 'import';
                    case 7:
                        return a === 'default' || a === 'finally' || a === 'extends';
                    case 8:
                        return a === 'function' || a === 'continue' || a === 'debugger';
                    case 10:
                        return a === 'instanceof';
                    default:
                        return !1
                }
            }

            function f(a, b) {
                return a === 'null' || a === 'true' || a === 'false' || g(a, b)
            }

            function h(a, b) {
                return a === 'null' || a === 'true' || a === 'false' || c(a, b)
            }

            function j(a) {
                return a === 'eval' || a === 'arguments'
            }

            function e(b) {
                var c, e, a;
                if (b.length === 0) return !1;
                if (a = b.charCodeAt(0), !d.isIdentifierStart(a) || a === 92) return !1;
                for (c = 1, e = b.length; c < e; ++c)
                    if (a = b.charCodeAt(c), !d.isIdentifierPart(a) || a === 92) return !1;
                return !0
            }

            function l(a, b) {
                return e(a) && !f(a, b)
            }

            function k(a, b) {
                return e(a) && !h(a, b)
            }
            d = a('/node_modules/esutils/lib/code.js', b), b.exports = {
                isKeywordES5: g,
                isKeywordES6: c,
                isReservedWordES5: f,
                isReservedWordES6: h,
                isRestrictedWord: j,
                isIdentifierName: e,
                isIdentifierES5: l,
                isIdentifierES6: k
            }
        }()
    }), a.define('/node_modules/esutils/lib/code.js', function(a, b, c, d) {
        ! function(b) {
            'use strict';

            function c(a) {
                return a >= 48 && a <= 57
            }

            function d(a) {
                return c(a) || 97 <= a && a <= 102 || 65 <= a && a <= 70
            }

            function e(a) {
                return a >= 48 && a <= 55
            }

            function f(a) {
                return a === 32 || a === 9 || a === 11 || a === 12 || a === 160 || a >= 5760 && [5760, 6158, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8239, 8287, 12288, 65279].indexOf(a) >= 0
            }

            function g(a) {
                return a === 10 || a === 13 || a === 8232 || a === 8233
            }

            function h(a) {
                return a === 36 || a === 95 || a >= 65 && a <= 90 || a >= 97 && a <= 122 || a === 92 || a >= 128 && b.NonAsciiIdentifierStart.test(String.fromCharCode(a))
            }

            function i(a) {
                return a === 36 || a === 95 || a >= 65 && a <= 90 || a >= 97 && a <= 122 || a >= 48 && a <= 57 || a === 92 || a >= 128 && b.NonAsciiIdentifierPart.test(String.fromCharCode(a))
            }
            b = {
                NonAsciiIdentifierStart: new RegExp('[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〇〡-〩〱-〵〸-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]'),
                NonAsciiIdentifierPart: new RegExp('[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮ̀-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁ҃-҇Ҋ-ԧԱ-Ֆՙա-և֑-ׇֽֿׁׂׅׄא-תװ-ײؐ-ؚؠ-٩ٮ-ۓە-ۜ۟-۪ۨ-ۼۿܐ-݊ݍ-ޱ߀-ߵߺࠀ-࠭ࡀ-࡛ࢠࢢ-ࢬࣤ-ࣾऀ-ॣ०-९ॱ-ॷॹ-ॿঁ-ঃঅ-ঌএঐও-নপ-রলশ-হ়-ৄেৈো-ৎৗড়ঢ়য়-ৣ০-ৱਁ-ਃਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹ਼ਾ-ੂੇੈੋ-੍ੑਖ਼-ੜਫ਼੦-ੵઁ-ઃઅ-ઍએ-ઑઓ-નપ-રલળવ-હ઼-ૅે-ૉો-્ૐૠ-ૣ૦-૯ଁ-ଃଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହ଼-ୄେୈୋ-୍ୖୗଡ଼ଢ଼ୟ-ୣ୦-୯ୱஂஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹா-ூெ-ைொ-்ௐௗ௦-௯ఁ-ఃఅ-ఌఎ-ఐఒ-నప-ళవ-హఽ-ౄె-ైొ-్ౕౖౘౙౠ-ౣ౦-౯ಂಃಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹ಼-ೄೆ-ೈೊ-್ೕೖೞೠ-ೣ೦-೯ೱೲംഃഅ-ഌഎ-ഐഒ-ഺഽ-ൄെ-ൈൊ-ൎൗൠ-ൣ൦-൯ൺ-ൿංඃඅ-ඖක-නඳ-රලව-ෆ්ා-ුූෘ-ෟෲෳก-ฺเ-๎๐-๙ກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ູົ-ຽເ-ໄໆ່-ໍ໐-໙ໜ-ໟༀ༘༙༠-༩༹༵༷༾-ཇཉ-ཬཱ-྄྆-ྗྙ-ྼ࿆က-၉ၐ-ႝႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚ፝-፟ᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-᜔ᜠ-᜴ᝀ-ᝓᝠ-ᝬᝮ-ᝰᝲᝳក-៓ៗៜ៝០-៩᠋-᠍᠐-᠙ᠠ-ᡷᢀ-ᢪᢰ-ᣵᤀ-ᤜᤠ-ᤫᤰ-᤻᥆-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉ᧐-᧙ᨀ-ᨛᨠ-ᩞ᩠-᩿᩼-᪉᪐-᪙ᪧᬀ-ᭋ᭐-᭙᭫-᭳ᮀ-᯳ᰀ-᰷᱀-᱉ᱍ-ᱽ᳐-᳔᳒-ᳶᴀ-ᷦ᷼-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼ‌‍‿⁀⁔ⁱⁿₐ-ₜ⃐-⃥⃜⃡-⃰ℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯ⵿-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⷠ-ⷿⸯ々-〇〡-〯〱-〵〸-〼ぁ-ゖ゙゚ゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘫꙀ-꙯ꙴ-꙽ꙿ-ꚗꚟ-꛱ꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠧꡀ-ꡳꢀ-꣄꣐-꣙꣠-ꣷꣻ꤀-꤭ꤰ-꥓ꥠ-ꥼꦀ-꧀ꧏ-꧙ꨀ-ꨶꩀ-ꩍ꩐-꩙ꩠ-ꩶꩺꩻꪀ-ꫂꫛ-ꫝꫠ-ꫯꫲ-꫶ꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯪ꯬꯭꯰-꯹가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻ︀-️︠-︦︳︴﹍-﹏ﹰ-ﹴﹶ-ﻼ０-９Ａ-Ｚ＿ａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]')
            }, a.exports = {
                isDecimalDigit: c,
                isHexDigit: d,
                isOctalDigit: e,
                isWhiteSpace: f,
                isLineTerminator: g,
                isIdentifierStart: h,
                isIdentifierPart: i
            }
        }()
    }), a.define('/node_modules/esutils/lib/ast.js', function(a, b, c, d) {
        ! function() {
            'use strict';

            function d(a) {
                if (a == null) return !1;
                switch (a.type) {
                    case 'ArrayExpression':
                    case 'AssignmentExpression':
                    case 'BinaryExpression':
                    case 'CallExpression':
                    case 'ConditionalExpression':
                    case 'FunctionExpression':
                    case 'Identifier':
                    case 'Literal':
                    case 'LogicalExpression':
                    case 'MemberExpression':
                    case 'NewExpression':
                    case 'ObjectExpression':
                    case 'SequenceExpression':
                    case 'ThisExpression':
                    case 'UnaryExpression':
                    case 'UpdateExpression':
                        return !0
                }
                return !1
            }

            function e(a) {
                if (a == null) return !1;
                switch (a.type) {
                    case 'DoWhileStatement':
                    case 'ForInStatement':
                    case 'ForStatement':
                    case 'WhileStatement':
                        return !0
                }
                return !1
            }

            function b(a) {
                if (a == null) return !1;
                switch (a.type) {
                    case 'BlockStatement':
                    case 'BreakStatement':
                    case 'ContinueStatement':
                    case 'DebuggerStatement':
                    case 'DoWhileStatement':
                    case 'EmptyStatement':
                    case 'ExpressionStatement':
                    case 'ForInStatement':
                    case 'ForStatement':
                    case 'IfStatement':
                    case 'LabeledStatement':
                    case 'ReturnStatement':
                    case 'SwitchStatement':
                    case 'ThrowStatement':
                    case 'TryStatement':
                    case 'VariableDeclaration':
                    case 'WhileStatement':
                    case 'WithStatement':
                        return !0
                }
                return !1
            }

            function f(a) {
                return b(a) || a != null && a.type === 'FunctionDeclaration'
            }

            function c(a) {
                switch (a.type) {
                    case 'IfStatement':
                        return a.alternate != null ? a.alternate : a.consequent;
                    case 'LabeledStatement':
                    case 'ForStatement':
                    case 'ForInStatement':
                    case 'WhileStatement':
                    case 'WithStatement':
                        return a.body
                }
                return null
            }

            function g(b) {
                var a;
                if (b.type !== 'IfStatement') return !1;
                if (b.alternate == null) return !1;
                a = b.consequent;
                do {
                    if (a.type === 'IfStatement' && a.alternate == null) return !0;
                    a = c(a)
                } while (a);
                return !1
            }
            a.exports = {
                isExpression: d,
                isStatement: b,
                isIterationStatement: e,
                isSourceElement: f,
                isProblematicIfStatement: g,
                trailingStatement: c
            }
        }()
    }), a.define('/node_modules/estraverse/estraverse.js', function(b, a, c, d) {
        ! function(c, b) {
            'use strict';
            typeof define === 'function' && define.amd ? define(['exports'], b) : a !== void 0 ? b(a) : b(c.estraverse = {})
        }(this, function(e) {
            'use strict';

            function m() {}

            function l(d) {
                var c = {}, a, b;
                for (a in d) d.hasOwnProperty(a) && (b = d[a], typeof b === 'object' && b !== null ? c[a] = l(b) : c[a] = b);
                return c
            }

            function s(b) {
                var c = {}, a;
                for (a in b) b.hasOwnProperty(a) && (c[a] = b[a]);
                return c
            }

            function r(e, f) {
                var b, a, c, d;
                a = e.length, c = 0;
                while (a) b = a >>> 1, d = c + b, f(e[d]) ? a = b : (c = d + 1, a -= b + 1);
                return c
            }

            function q(e, f) {
                var b, a, c, d;
                a = e.length, c = 0;
                while (a) b = a >>> 1, d = c + b, f(e[d]) ? (c = d + 1, a -= b + 1) : a = b;
                return c
            }

            function h(a, b) {
                this.parent = a, this.key = b
            }

            function d(a, b, c, d) {
                this.node = a, this.path = b, this.wrap = c, this.ref = d
            }

            function b() {}

            function k(c, d) {
                var a = new b;
                return a.traverse(c, d)
            }

            function p(c, d) {
                var a = new b;
                return a.replace(c, d)
            }

            function n(a, c) {
                var b;
                return b = r(c, function b(c) {
                    return c.range[0] > a.range[0]
                }), a.extendedRange = [a.range[0], a.range[1]], b !== c.length && (a.extendedRange[1] = c[b].range[0]), b -= 1, b >= 0 && (a.extendedRange[0] = c[b].range[1]), a
            }

            function o(d, e, i) {
                var a = [],
                    h, g, c, b;
                if (!d.range) throw new Error('attachComments needs range information');
                if (!i.length) {
                    if (e.length) {
                        for (c = 0, g = e.length; c < g; c += 1) h = l(e[c]), h.extendedRange = [0, d.range[0]], a.push(h);
                        d.leadingComments = a
                    }
                    return d
                }
                for (c = 0, g = e.length; c < g; c += 1) a.push(n(l(e[c]), i));
                return b = 0, k(d, {
                    enter: function(c) {
                        var d;
                        while (b < a.length) {
                            if (d = a[b], d.extendedRange[1] > c.range[0]) break;
                            d.extendedRange[1] === c.range[0] ? (c.leadingComments || (c.leadingComments = []), c.leadingComments.push(d), a.splice(b, 1)) : b += 1
                        }
                        return b === a.length ? f.Break : a[b].extendedRange[0] > c.range[1] ? f.Skip : void 0
                    }
                }), b = 0, k(d, {
                    leave: function(c) {
                        var d;
                        while (b < a.length) {
                            if (d = a[b], c.range[1] < d.extendedRange[0]) break;
                            c.range[1] === d.extendedRange[0] ? (c.trailingComments || (c.trailingComments = []), c.trailingComments.push(d), a.splice(b, 1)) : b += 1
                        }
                        return b === a.length ? f.Break : a[b].extendedRange[0] > c.range[1] ? f.Skip : void 0
                    }
                }), d
            }
            var i, g, f, j, a, c;
            i = {
                AssignmentExpression: 'AssignmentExpression',
                ArrayExpression: 'ArrayExpression',
                ArrayPattern: 'ArrayPattern',
                ArrowFunctionExpression: 'ArrowFunctionExpression',
                BlockStatement: 'BlockStatement',
                BinaryExpression: 'BinaryExpression',
                BreakStatement: 'BreakStatement',
                CallExpression: 'CallExpression',
                CatchClause: 'CatchClause',
                ClassBody: 'ClassBody',
                ClassDeclaration: 'ClassDeclaration',
                ClassExpression: 'ClassExpression',
                ConditionalExpression: 'ConditionalExpression',
                ContinueStatement: 'ContinueStatement',
                DebuggerStatement: 'DebuggerStatement',
                DirectiveStatement: 'DirectiveStatement',
                DoWhileStatement: 'DoWhileStatement',
                EmptyStatement: 'EmptyStatement',
                ExpressionStatement: 'ExpressionStatement',
                ForStatement: 'ForStatement',
                ForInStatement: 'ForInStatement',
                FunctionDeclaration: 'FunctionDeclaration',
                FunctionExpression: 'FunctionExpression',
                Identifier: 'Identifier',
                IfStatement: 'IfStatement',
                Literal: 'Literal',
                LabeledStatement: 'LabeledStatement',
                LogicalExpression: 'LogicalExpression',
                MemberExpression: 'MemberExpression',
                MethodDefinition: 'MethodDefinition',
                NewExpression: 'NewExpression',
                ObjectExpression: 'ObjectExpression',
                ObjectPattern: 'ObjectPattern',
                Program: 'Program',
                Property: 'Property',
                ReturnStatement: 'ReturnStatement',
                SequenceExpression: 'SequenceExpression',
                SwitchStatement: 'SwitchStatement',
                SwitchCase: 'SwitchCase',
                ThisExpression: 'ThisExpression',
                ThrowStatement: 'ThrowStatement',
                TryStatement: 'TryStatement',
                UnaryExpression: 'UnaryExpression',
                UpdateExpression: 'UpdateExpression',
                VariableDeclaration: 'VariableDeclaration',
                VariableDeclarator: 'VariableDeclarator',
                WhileStatement: 'WhileStatement',
                WithStatement: 'WithStatement',
                YieldExpression: 'YieldExpression'
            }, g = Array.isArray, g || (g = function a(b) {
                return Object.prototype.toString.call(b) === '[object Array]'
            }), m(s), m(q), j = {
                AssignmentExpression: ['left', 'right'],
                ArrayExpression: ['elements'],
                ArrayPattern: ['elements'],
                ArrowFunctionExpression: ['params', 'defaults', 'rest', 'body'],
                BlockStatement: ['body'],
                BinaryExpression: ['left', 'right'],
                BreakStatement: ['label'],
                CallExpression: ['callee', 'arguments'],
                CatchClause: ['param', 'body'],
                ClassBody: ['body'],
                ClassDeclaration: ['id', 'body', 'superClass'],
                ClassExpression: ['id', 'body', 'superClass'],
                ConditionalExpression: ['test', 'consequent', 'alternate'],
                ContinueStatement: ['label'],
                DebuggerStatement: [],
                DirectiveStatement: [],
                DoWhileStatement: ['body', 'test'],
                EmptyStatement: [],
                ExpressionStatement: ['expression'],
                ForStatement: ['init', 'test', 'update', 'body'],
                ForInStatement: ['left', 'right', 'body'],
                ForOfStatement: ['left', 'right', 'body'],
                FunctionDeclaration: ['id', 'params', 'defaults', 'rest', 'body'],
                FunctionExpression: ['id', 'params', 'defaults', 'rest', 'body'],
                Identifier: [],
                IfStatement: ['test', 'consequent', 'alternate'],
                Literal: [],
                LabeledStatement: ['label', 'body'],
                LogicalExpression: ['left', 'right'],
                MemberExpression: ['object', 'property'],
                MethodDefinition: ['key', 'value'],
                NewExpression: ['callee', 'arguments'],
                ObjectExpression: ['properties'],
                ObjectPattern: ['properties'],
                Program: ['body'],
                Property: ['key', 'value'],
                ReturnStatement: ['argument'],
                SequenceExpression: ['expressions'],
                SwitchStatement: ['discriminant', 'cases'],
                SwitchCase: ['test', 'consequent'],
                ThisExpression: [],
                ThrowStatement: ['argument'],
                TryStatement: ['block', 'handlers', 'handler', 'guardedHandlers', 'finalizer'],
                UnaryExpression: ['argument'],
                UpdateExpression: ['argument'],
                VariableDeclaration: ['declarations'],
                VariableDeclarator: ['id', 'init'],
                WhileStatement: ['test', 'body'],
                WithStatement: ['object', 'body'],
                YieldExpression: ['argument']
            }, a = {}, c = {}, f = {
                Break: a,
                Skip: c
            }, h.prototype.replace = function a(b) {
                this.parent[this.key] = b
            }, b.prototype.path = function a() {
                function e(b, a) {
                    if (g(a))
                        for (c = 0, h = a.length; c < h; ++c) b.push(a[c]);
                    else b.push(a)
                }
                var b, f, c, h, d, i;
                if (!this.__current.path) return null;
                for (d = [], b = 2, f = this.__leavelist.length; b < f; ++b) i = this.__leavelist[b], e(d, i.path);
                return e(d, this.__current.path), d
            }, b.prototype.parents = function a() {
                var b, d, c;
                for (c = [], b = 1, d = this.__leavelist.length; b < d; ++b) c.push(this.__leavelist[b].node);
                return c
            }, b.prototype.current = function a() {
                return this.__current.node
            }, b.prototype.__execute = function a(c, d) {
                var e, b;
                return b = undefined, e = this.__current, this.__current = d, this.__state = null, c && (b = c.call(this, d.node, this.__leavelist[this.__leavelist.length - 1].node)), this.__current = e, b
            }, b.prototype.notify = function a(b) {
                this.__state = b
            }, b.prototype.skip = function() {
                this.notify(c)
            }, b.prototype['break'] = function() {
                this.notify(a)
            }, b.prototype.__initialize = function(a, b) {
                this.visitor = b, this.root = a, this.__worklist = [], this.__leavelist = [], this.__current = null, this.__state = null
            }, b.prototype.traverse = function b(u, r) {
                var h, o, e, t, n, l, m, p, k, q, f, s;
                this.__initialize(u, r), s = {}, h = this.__worklist, o = this.__leavelist, h.push(new d(u, null, null, null)), o.push(new d(null, null, null, null));
                while (h.length) {
                    if (e = h.pop(), e === s) {
                        if (e = o.pop(), l = this.__execute(r.leave, e), this.__state === a || l === a) return;
                        continue
                    }
                    if (e.node) {
                        if (l = this.__execute(r.enter, e), this.__state === a || l === a) return;
                        if (h.push(s), o.push(e), this.__state === c || l === c) continue;
                        t = e.node, n = e.wrap || t.type, q = j[n], p = q.length;
                        while ((p -= 1) >= 0) {
                            if (m = q[p], f = t[m], !f) continue;
                            if (!g(f)) {
                                h.push(new d(f, m, null, null));
                                continue
                            }
                            k = f.length;
                            while ((k -= 1) >= 0) {
                                if (!f[k]) continue;
                                (n === i.ObjectExpression || n === i.ObjectPattern) && 'properties' === q[p] ? e = new d(f[k], [m, k], 'Property', null) : e = new d(f[k], [m, k], null, null), h.push(e)
                            }
                        }
                    }
                }
            }, b.prototype.replace = function b(u, v) {
                var m, r, o, t, f, e, q, l, s, k, w, p, n;
                this.__initialize(u, v), w = {}, m = this.__worklist, r = this.__leavelist, p = {
                    root: u
                }, e = new d(u, null, null, new h(p, 'root')), m.push(e), r.push(e);
                while (m.length) {
                    if (e = m.pop(), e === w) {
                        if (e = r.pop(), f = this.__execute(v.leave, e), f !== undefined && f !== a && f !== c && e.ref.replace(f), this.__state === a || f === a) return p.root;
                        continue
                    }
                    if (f = this.__execute(v.enter, e), f !== undefined && f !== a && f !== c && (e.ref.replace(f), e.node = f), this.__state === a || f === a) return p.root;
                    if (o = e.node, !o) continue;
                    if (m.push(w), r.push(e), this.__state === c || f === c) continue;
                    t = e.wrap || o.type, s = j[t], q = s.length;
                    while ((q -= 1) >= 0) {
                        if (n = s[q], k = o[n], !k) continue;
                        if (!g(k)) {
                            m.push(new d(k, n, null, new h(o, n)));
                            continue
                        }
                        l = k.length;
                        while ((l -= 1) >= 0) {
                            if (!k[l]) continue;
                            t === i.ObjectExpression && 'properties' === s[q] ? e = new d(k[l], [n, l], 'Property', new h(k, l)) : e = new d(k[l], [n, l], null, new h(k, l)), m.push(e)
                        }
                    }
                }
                return p.root
            }, e.version = '1.5.1-dev', e.Syntax = i, e.traverse = k, e.replace = p, e.attachComments = o, e.VisitorKeys = j, e.VisitorOption = f, e.Controller = b
        })
    }), a('/tools/entry-point.js')
}.call(this, this))

;

(function(root, mod) {

})
