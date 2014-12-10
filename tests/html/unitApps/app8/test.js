// START OF JALANGI LIBS

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

window.JALANGI_MODE='inbrowser';
window.USE_SMEMORY=true;
if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {
    var Constants = sandbox.Constants = {};

    Constants.isBrowser = !(typeof exports !== 'undefined' && this.exports !== exports);

    Constants.IN_MEMORY_TRACE = Constants.isBrowser && (window.__JALANGI_IN_MEMORY_TRACE__);

    var APPLY = Constants.APPLY = Function.prototype.apply;
    var CALL = Constants.CALL = Function.prototype.call;
    APPLY.apply = APPLY;
    APPLY.call = CALL;
    CALL.apply = APPLY;
    CALL.call = CALL;

    var HAS_OWN_PROPERTY = Constants.HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;
    Constants.HAS_OWN_PROPERTY_CALL = Object.prototype.hasOwnProperty.call;


    var PREFIX1 = "J$";
    Constants.SPECIAL_PROP = "*" + PREFIX1 + "*";
    Constants.SPECIAL_PROP2 = "*" + PREFIX1 + "I*";
    Constants.SPECIAL_PROP3 = "*" + PREFIX1 + "C*";
    Constants.SPECIAL_PROP4 = "*" + PREFIX1 + "W*";

    Constants.MODE_RECORD = 1;
    Constants.MODE_REPLAY = 2;
    Constants.MODE_NO_RR_IGNORE_UNINSTRUMENTED = 3;
    Constants.MODE_NO_RR = 4;
    Constants.MODE_DIRECT = 5;

    Constants.T_NULL = 0;
    Constants.T_NUMBER = 1;
    Constants.T_BOOLEAN = 2;
    var T_STRING = Constants.T_STRING = 3;
    Constants.T_OBJECT = 4;
    Constants.T_FUNCTION = 5;
    Constants.T_UNDEFINED = 6;
    Constants.T_ARRAY = 7;

    var F_TYPE = Constants.F_TYPE = 0;
    var F_VALUE = Constants.F_VALUE = 1;
    Constants.F_IID = 2;
    Constants.F_SEQ = 3;
    Constants.F_FUNNAME = 4;

    Constants.UNKNOWN = -1;

    Constants.N_LOG_FUNCTION_ENTER = 4;
    Constants.N_LOG_SCRIPT_ENTER = 6;
    Constants.N_LOG_GETFIELD = 8;
    Constants.N_LOG_ARRAY_LIT = 10;
    Constants.N_LOG_OBJECT_LIT = 11;
    Constants.N_LOG_FUNCTION_LIT = 12;
    Constants.N_LOG_RETURN = 13;
    Constants.N_LOG_REGEXP_LIT = 14;
    Constants.N_LOG_READ = 17;
    Constants.N_LOG_LOAD = 18;
    Constants.N_LOG_HASH = 19;
    Constants.N_LOG_SPECIAL = 20;
    Constants.N_LOG_STRING_LIT = 21;
    Constants.N_LOG_NUMBER_LIT = 22;
    Constants.N_LOG_BOOLEAN_LIT = 23;
    Constants.N_LOG_UNDEFINED_LIT = 24;
    Constants.N_LOG_NULL_LIT = 25;
    // property read *directly* from an object (not from the prototype chain)
    Constants.N_LOG_GETFIELD_OWN = 26;
    Constants.N_LOG_OPERATION = 27;

    //-------------------------------- End constants ---------------------------------

    //-------------------------------------- Constant functions -----------------------------------------------------------

    Constants.getConcrete = function (val) {
        if (sandbox.analysis && sandbox.analysis.getConcrete) {
            return sandbox.analysis.getConcrete(val);
        } else {
            return val;
        }
    }

    Constants.getSymbolic = function (val) {
        if (sandbox.analysis && sandbox.analysis.getSymbolic) {
            return sandbox.analysis.getSymbolic(val);
        } else {
            return val;
        }
    }

    var HOP = Constants.HOP = function (obj, prop) {
        return (prop + "" === '__proto__') || CALL.call(HAS_OWN_PROPERTY, obj, prop); //Constants.HAS_OWN_PROPERTY_CALL.apply(Constants.HAS_OWN_PROPERTY, [obj, prop]);
    }

    Constants.hasGetterSetter = function (obj, prop, isGetter) {
        if (typeof Object.getOwnPropertyDescriptor !== 'function') {
            return true;
        }
        while (obj !== null) {
            if (typeof obj !== 'object' && typeof obj !== 'function') {
                return false;
            }
            var desc = Object.getOwnPropertyDescriptor(obj, prop);
            if (desc !== undefined) {
                if (isGetter && typeof desc.get === 'function') {
                    return true;
                }
                if (!isGetter && typeof desc.set === 'function') {
                    return true;
                }
            } else if (HOP(obj, prop)) {
                return false;
            }
            obj = obj.__proto__;
        }
        return false;
    }

    Constants.debugPrint = function (s) {
        if (sandbox.Config.DEBUG) {
            console.log("***" + s);
        }
    }

    Constants.warnPrint = function (iid, s) {
        if (sandbox.Config.WARN && iid !== 0) {
            console.log("        at " + iid + " " + s);
        }
    }

    Constants.seriousWarnPrint = function (iid, s) {
        if (sandbox.Config.SERIOUS_WARN && iid !== 0) {
            console.log("        at " + iid + " Serious " + s);
        }
    }

    Constants.encodeNaNandInfForJSON = function (key, value) {
        if (value === Infinity) {
            return "Infinity";
        } else if (value !== value) {
            return "NaN";
        }
        return value;
    }

    Constants.decodeNaNandInfForJSON = function (key, value) {
        if (value === "Infinity") {
            return Infinity;
        } else if (value === 'NaN') {
            return NaN;
        } else {
            return value;
        }
    }

    Constants.fixForStringNaN = function (record) {
        if (record[F_TYPE] == T_STRING) {
            if (record[F_VALUE] !== record[F_VALUE]) {
                record[F_VALUE] = 'NaN';
            } else if (record[F_VALUE] === Infinity) {
                record[F_VALUE] = 'Infinity';
            }

        }
    }

})(J$);

if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {
    var Config = sandbox.Config = {};

    Config.DEBUG = false;
    Config.WARN = false;
    Config.SERIOUS_WARN = false;
// make MAX_BUF_SIZE slightly less than 2^16, to allow over low-level overheads
    Config.MAX_BUF_SIZE = 64000;
    Config.LOG_ALL_READS_AND_BRANCHES = false;

    //**********************************************************
    //  Functions for selective instrumentation of operations
    //**********************************************************
    // In the following functions
    // return true in a function, if you want the ast node (passed as the second argument) to be instrumented
    // ast node gets instrumented if you do not define the corresponding function
//    Config.INSTR_READ = function(name, ast) { return false; };
//    Config.INSTR_WRITE = function(name, ast) { return true; };
//    Config.INSTR_GETFIELD = function(offset, ast) { return true; }; // offset is null if the property is computed
//    Config.INSTR_PUTFIELD = function(offset, ast) { return true; }; // offset is null if the property is computed
//    Config.INSTR_BINARY = function(operator, ast) { return true; };
//    Config.INSTR_PROPERTY_BINARY_ASSIGNMENT = function(operator, offset, ast) { return true; }; // a.x += e or a[e1] += e2
//    Config.INSTR_UNARY = function(operator, ast) { return true; };
//    Config.INSTR_LITERAL = function(literal, ast) { return true;}; // literal gets some dummy value if the type is object, function, or array
//    Config.INSTR_CONDITIONAL = function(type, ast) { return true; }; // type could be "&&", "||", "switch", "other"
}(J$));
if (typeof J$ === 'undefined') {
    J$ = {};
}


(function (sandbox) {
    var Globals = sandbox.Globals = {};
    Globals.mode;
    Globals.isInstrumentedCaller;
    Globals.isMethodCall;
    Globals.isConstructorCall;
    Globals.isBrowserReplay;
    Globals.traceFileName;
    Globals.traceWriter;
    Globals.loadAndBranchLogs = [];

}(J$));if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {


    sandbox.TraceWriter = function () {
        var Constants = sandbox.Constants;
        var Globals = sandbox.Globals;
        var Config = sandbox.Config;

        var bufferSize = 0;
        var buffer = [];
        var traceWfh;
        var fs = (!Constants.isBrowser) ? require('fs') : undefined;
        var trying = false;
        var cb;
        var remoteBuffer = [];
        var socket, isOpen = false;
        // if true, in the process of doing final trace dump,
        // so don't record any more events
        var tracingDone = false;

        if (Constants.IN_MEMORY_TRACE) {
            // attach the buffer to the sandbox
            sandbox.trace_output = buffer;
        }

        function getFileHanlde() {
            if (traceWfh === undefined) {
                traceWfh = fs.openSync(Globals.traceFileName, 'w');
            }
            return traceWfh;
        }

        /**
         * @param {string} line
         */
        this.logToFile = function (line) {
            if (tracingDone) {
                // do nothing
                return;
            }
            var len = line.length;
            // we need this loop because it's possible that len >= Config.MAX_BUF_SIZE
            // TODO fast path for case where len < Config.MAX_BUF_SIZE?
            var start = 0, end = len < Config.MAX_BUF_SIZE ? len : Config.MAX_BUF_SIZE;
            while (start < len) {
                var chunk = line.substring(start, end);
                var curLen = end - start;
                if (bufferSize + curLen > Config.MAX_BUF_SIZE) {
                    this.flush();
                }
                buffer.push(chunk);
                bufferSize += curLen;
                start = end;
                end = (end + Config.MAX_BUF_SIZE < len) ? end + Config.MAX_BUF_SIZE : len;
            }
        };

        this.flush = function () {
            if (Constants.IN_MEMORY_TRACE) {
                // no need to flush anything
                return;
            }
            var msg;
            if (!Constants.isBrowser) {
                var length = buffer.length;
                for (var i = 0; i < length; i++) {
                    fs.writeSync(getFileHanlde(), buffer[i]);
                }
            } else {
                msg = buffer.join('');
                if (msg.length > 1) {
                    this.remoteLog(msg);
                }
            }
            bufferSize = 0;
            buffer = [];
        };


        function openSocketIfNotOpen() {
            if (!socket) {
                console.log("Opening connection");
                socket = new WebSocket('ws://127.0.0.1:8080', 'log-protocol');
                socket.onopen = tryRemoteLog;
                socket.onmessage = tryRemoteLog2;
            }
        }

        /**
         * invoked when we receive a message over the websocket,
         * indicating that the last trace chunk in the remoteBuffer
         * has been received
         */
        function tryRemoteLog2() {
            trying = false;
            remoteBuffer.shift();
            if (remoteBuffer.length === 0) {
                if (cb) {
                    cb();
                    cb = undefined;
                }
            }
            tryRemoteLog();
        }

        this.onflush = function (callback) {
            if (remoteBuffer.length === 0) {
                if (callback) {
                    callback();
                }
            } else {
                cb = callback;
                tryRemoteLog();
            }
        };

        function tryRemoteLog() {
            isOpen = true;
            if (!trying && remoteBuffer.length > 0) {
                trying = true;
                socket.send(remoteBuffer[0]);
            }
        }

        this.remoteLog = function (message) {
            if (message.length > Config.MAX_BUF_SIZE) {
                throw new Error("message too big!!!");
            }
            remoteBuffer.push(message);
            openSocketIfNotOpen();
            if (isOpen) {
                tryRemoteLog();
            }
        };

        /**
         * stop recording the trace and flush everything
         */
        this.stopTracing = function () {
            tracingDone = true;
            if (!Constants.IN_MEMORY_TRACE) {
                this.flush();
            }
        };
    }

})(J$);
if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {

    sandbox.TraceReader = function () {
        var Constants = sandbox.Constants;
        var Globals = sandbox.Globals;
        var Config = sandbox.Config;

        var F_SEQ = Constants.F_SEQ;
        var F_TYPE = Constants.F_TYPE;
        var F_VALUE = Constants.F_VALUE;
        var F_IID = Constants.F_IID;
        var F_FUNNAME = Constants.F_FUNNAME;
        var N_LOG_LOAD = Constants.N_LOG_LOAD;
        var N_LOG_HASH = Constants.N_LOG_HASH;

        var T_OBJECT = Constants.T_OBJECT;
        var T_FUNCTION = Constants.T_FUNCTION;
        var T_ARRAY = Constants.T_ARRAY;


        var decodeNaNandInfForJSON = Constants.decodeNaNandInfForJSON;
        var fixForStringNaN = Constants.fixForStringNaN;
        var debugPrint = Constants.debugPrint;

        var traceArray = [];
        this.traceIndex = 0;
        var currentIndex = 0;
        var frontierIndex = 0;
        var MAX_SIZE = 1024;
        var traceFh;
        var done = false;
        var curRecord = null;

        var count = 0;
        var count2 = 0;

        this.objectIdLife = [];

        this.populateObjectIdLife = function () {
            if (Constants.isBrowserReplay) {
                return;
            }
            var type;
            var FileLineReader = require('./utils/FileLineReader');
            var traceFh = new FileLineReader(Globals.traceFileName);
            while (traceFh.hasNextLine()) {
                var record = JSON.parse(traceFh.nextLine(), decodeNaNandInfForJSON);
                if (((type = record[F_TYPE]) === T_OBJECT || type === T_ARRAY || type === T_FUNCTION) && record[F_FUNNAME] !== N_LOG_HASH && record[F_VALUE] !== Constants.UNKNOWN) {
                    this.objectIdLife[record[F_VALUE]] = record[F_SEQ];
                }
                if (record[F_FUNNAME] === N_LOG_LOAD && record[F_VALUE] !== Constants.UNKNOWN) {
                    this.objectIdLife[record[F_VALUE]] = record[F_SEQ];
                }
            }
            traceFh.close();
        };

        this.hasFutureReference = function (id) {
            var ret = (this.objectIdLife[id] >= this.traceIndex);
            return ret;
        };

        this.canDeleteReference = function (recordedArray) {
            var ret = (this.objectIdLife[recordedArray[F_VALUE]] === recordedArray[F_SEQ]);
            return ret;
        };

        function cacheRecords() {
            var i = 0, flag, record;

            if (Constants.isBrowserReplay) {
                return;
            }
            if (currentIndex >= frontierIndex) {
                if (!traceFh) {
                    var FileLineReader = require('./utils/FileLineReader');
                    traceFh = new FileLineReader(Globals.traceFileName);
                    // change working directory to wherever trace file resides
                    var pth = require('path');
                    var traceFileDir = pth.dirname(pth.resolve(process.cwd(), Globals.traceFileName));
                    process.chdir(traceFileDir);
                }
                traceArray = [];
                while (!done && (flag = traceFh.hasNextLine()) && i < MAX_SIZE) {
                    record = JSON.parse(traceFh.nextLine(), decodeNaNandInfForJSON);
                    fixForStringNaN(record);
                    traceArray.push(record);
                    debugPrint(i + ":" + JSON.stringify(record /*, encodeNaNandInfForJSON*/));
                    frontierIndex++;
                    i++;
                }
                if (!flag && !done) {
                    traceFh.close();
                    done = true;
                }
            }
        }

        this.addRecord = function (line) {
            var record = JSON.parse(line, decodeNaNandInfForJSON);
            fixForStringNaN(record);
            traceArray.push(record);
            debugPrint(JSON.stringify(record /*, encodeNaNandInfForJSON*/));
            frontierIndex++;
        };

        this.getAndNext = function () {
            if (curRecord !== null) {
                var ret = curRecord;
                curRecord = null;
                return ret;
            }
            cacheRecords();
            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
            var record = traceArray[j];
            if (record && record[F_SEQ] === this.traceIndex) {
                currentIndex++;
            } else {
                record = undefined;
            }
            this.traceIndex++;
            return record;
        };

        this.getNext = function () {
            if (curRecord !== null) {
                throw new Error("Cannot do two getNext() in succession");
            }
            var tmp = this.getAndNext();
            var ret = this.getCurrent();
            curRecord = tmp;
            return ret;
        };

        this.getCurrent = function () {
            if (curRecord !== null) {
                return curRecord;
            }
            cacheRecords();
            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
            var record = traceArray[j];
            if (!(record && record[F_SEQ] === this.traceIndex)) {
                record = undefined;
            }
            return record;
        };

        this.next = function () {
            if (curRecord !== null) {
                curRecord = null;
                return;
            }
            cacheRecords();
            var j = Constants.isBrowserReplay ? currentIndex : currentIndex % MAX_SIZE;
            var record = traceArray[j];
            if (record && record[F_SEQ] === this.traceIndex) {
                currentIndex++;
            }
            this.traceIndex++;
        };

        this.getPreviousIndex = function () {
            if (curRecord !== null) {
                return this.traceIndex - 2;
            }
            return this.traceIndex - 1;
        };


    };

})(J$);
//----------------------------------- Record Replay Engine ---------------------------------

// create / reset J$ global variable to hold analysis runtime
if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {
    sandbox.SMemory = function () {
        var Constants = sandbox.Constants;

        var SPECIAL_PROP = Constants.SPECIAL_PROP + "M";
        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2 + "M";
        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3 + "M";
        var N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT;
        var objectId = 1;
        var frameId = 2;
        var scriptCount = 0;
        var HOP = Constants.HOP;


        var frame = Object.create(null);
        //frame[SPECIAL_PROP] = frameId;
        //frameId = frameId + 2;

        var frameStack = [frame];
        var evalFrames = [];


        function createShadowObject(val) {
            var type = typeof val;
            if ((type === 'object' || type === 'function') && val !== null && !HOP(val, SPECIAL_PROP)) {
                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                    Object.defineProperty(val, SPECIAL_PROP, {
                        enumerable:false,
                        writable:true
                    });
                }
                try {
                    val[SPECIAL_PROP] = Object.create(null);
                    val[SPECIAL_PROP][SPECIAL_PROP] = objectId;
                    objectId = objectId + 2;
                } catch (e) {
                    // cannot attach special field in some DOM Objects.  So ignore them.
                }
            }

        }

        this.getShadowObject = function (val) {
            var value;
            createShadowObject(val);
            var type = typeof val;
            if ((type === 'object' || type === 'function') && val !== null && HOP(val, SPECIAL_PROP)) {
                value = val[SPECIAL_PROP];
            } else {
                value = undefined;
            }
            return value;
        };

        this.getFrame = function (name) {
            var tmp = frame;
            while (tmp && !HOP(tmp, name)) {
                tmp = tmp[SPECIAL_PROP3];
            }
            if (tmp) {
                return tmp;
            } else {
                return frameStack[0]; // return global scope
            }
        };

        this.getParentFrame = function (otherFrame) {
            if (otherFrame) {
                return otherFrame[SPECIAL_PROP3];
            } else {
                return null;
            }
        };

        this.getCurrentFrame = function () {
            return frame;
        };

        this.getClosureFrame = function (fun) {
            return fun[SPECIAL_PROP3];
        };

        this.getShadowObjectID = function (obj) {
            return obj[SPECIAL_PROP];
        };

        this.defineFunction = function (val, type) {
            if (type === N_LOG_FUNCTION_LIT) {
                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                    Object.defineProperty(val, SPECIAL_PROP3, {
                        enumerable:false,
                        writable:true
                    });
                }
                val[SPECIAL_PROP3] = frame;
            }
        };

        this.evalBegin = function () {
            evalFrames.push(frame);
            frame = frameStack[0];
        };

        this.evalEnd = function () {
            frame = evalFrames.pop();
        };


        this.initialize = function (name) {
            frame[name] = undefined;
        };

        this.functionEnter = function (val) {
            frameStack.push(frame = Object.create(null));
            if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                Object.defineProperty(frame, SPECIAL_PROP3, {
                    enumerable:false,
                    writable:true
                });
            }
            frame[SPECIAL_PROP3] = val[SPECIAL_PROP3];
        };

        this.functionReturn = function () {
            frameStack.pop();
            frame = frameStack[frameStack.length - 1];
        };

        this.scriptEnter = function () {
            scriptCount++;
            if (scriptCount>1) {
                frameStack.push(frame = Object.create(null));
                //frame[SPECIAL_PROP] = frameId;
                //frameId = frameId + 2;
                frame[SPECIAL_PROP3] = frameStack[0];
            }
        };

        this.scriptReturn = function () {
            if (scriptCount>1) {
                frameStack.pop();
                frame = frameStack[frameStack.length - 1];
            }
            scriptCount--;
        };

    };

}(J$));


/*
 * Copyright 2013-2014 Samsung Information Systems America, Inc.
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

// Author: Koushik Sen

if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {
    var Constants = sandbox.Constants;
    var isBrowser = Constants?Constants.isBrowser:undefined;
    var isInit = false;

    sandbox.iidToLocation = function (iid) {
        var ret;
        if (!isInit) {
            isInit = true;
            if (!isBrowser) {
                try {
                    require(process.cwd()+"/jalangi_sourcemap");
                } catch (e) {
                    // don't crash if we can't find sourcemap file
                }
            }
        }
        if (sandbox.iids) {
            if ((ret = sandbox.iids[iid])) {

                return "("+ret[0]/*.replace("_orig_.js", ".js")*/+":"+ret[1]+":"+ret[2]+":"+ret[3]+":"+ret[4]+")";
            }
        }
        return iid+"";
    };

}(J$));
//----------------------------------- Record Replay Engine ---------------------------------

// create / reset J$ global variable to hold analysis runtime
if (typeof J$ === 'undefined') {
    J$ = {};
}

(function (sandbox) {

    //----------------------------------- Record Replay Engine ---------------------------------

    sandbox.RecordReplayEngine = function () {

        // get the constants in local variables for faster access

        var Constants = sandbox.Constants;
        var Globals = sandbox.Globals;
        var Config = sandbox.Config;
        var TraceWriter = sandbox.TraceWriter;
        var TraceReader = sandbox.TraceReader;

        var SPECIAL_PROP = Constants.SPECIAL_PROP;
        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2;
        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3;
        var SPECIAL_PROP4 = Constants.SPECIAL_PROP4;


        var MODE_RECORD = Constants.MODE_RECORD,
            MODE_REPLAY = Constants.MODE_REPLAY;

        var T_NULL = Constants.T_NULL,
            T_NUMBER = Constants.T_NUMBER,
            T_BOOLEAN = Constants.T_BOOLEAN,
            T_STRING = Constants.T_STRING,
            T_OBJECT = Constants.T_OBJECT,
            T_FUNCTION = Constants.T_FUNCTION,
            T_UNDEFINED = Constants.T_UNDEFINED,
            T_ARRAY = Constants.T_ARRAY;

        var F_TYPE = Constants.F_TYPE,
            F_VALUE = Constants.F_VALUE,
            F_IID = Constants.F_IID,
            F_SEQ = Constants.F_SEQ,
            F_FUNNAME = Constants.F_FUNNAME;

        var N_LOG_FUNCTION_ENTER = Constants.N_LOG_FUNCTION_ENTER,
            N_LOG_SCRIPT_ENTER = Constants.N_LOG_SCRIPT_ENTER,
            N_LOG_GETFIELD = Constants.N_LOG_GETFIELD,
            N_LOG_ARRAY_LIT = Constants.N_LOG_ARRAY_LIT,
            N_LOG_OBJECT_LIT = Constants.N_LOG_OBJECT_LIT,
            N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT,
            N_LOG_RETURN = Constants.N_LOG_RETURN,
            N_LOG_REGEXP_LIT = Constants.N_LOG_REGEXP_LIT,
            N_LOG_READ = Constants.N_LOG_READ,
            N_LOG_LOAD = Constants.N_LOG_LOAD,
            N_LOG_HASH = Constants.N_LOG_HASH,
            N_LOG_SPECIAL = Constants.N_LOG_SPECIAL,
            N_LOG_GETFIELD_OWN = Constants.N_LOG_GETFIELD_OWN;

        var HOP = Constants.HOP;
        var hasGetterSetter = Constants.hasGetterSetter;
        var getConcrete = Constants.getConcrete;
        var debugPrint = Constants.debugPrint;
        var warnPrint = Constants.warnPrint;
        var seriousWarnPrint = Constants.seriousWarnPrint;
        var encodeNaNandInfForJSON = Constants.encodeNaNandInfForJSON;

        var traceReader, traceWriter;
        var seqNo = 0;

        var frame = {"this":undefined};
        var frameStack = [frame];

        var evalFrames = [];

        var literalId = 2;

        var objectId = 1;
        var objectMap = [];
        var createdMockObject = false;
        /*
         type enumerations are
         null is 0
         number is 1
         boolean is 2
         string is 3
         object is 4
         function is 5
         undefined is 6
         array is 7
         */


        function load(path) {
            var head, script;
            head = document.getElementsByTagName('head')[0];
            script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = path;
            head.appendChild(script);
        }


        function printableValue(val) {
            var value, typen = getNumericType(val), ret = [];
            if (typen === T_NUMBER || typen === T_BOOLEAN || typen === T_STRING) {
                value = val;
            } else if (typen === T_UNDEFINED) {
                value = 0;
            } else {
                if (val === null) {
                    value = 0;
                } else {
                    try {
                        if (!HOP(val, SPECIAL_PROP)) {
                            createdMockObject = true;
                            if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                                try {
                                    Object.defineProperty(val, SPECIAL_PROP, {
                                        enumerable:false,
                                        writable:true
                                    });
                                } catch (e) {
                                    if (Constants.isBrowser && window.__JALANGI_PHANTOM__) {
                                        // known issue with older WebKit in PhantomJS
                                        // ignoring seems to not cause anything too harmful
                                    } else {
                                        throw e;
                                    }
                                }
                            }
                            if (typen === T_ARRAY) {
                                val[SPECIAL_PROP] = [];//Object.create(null);
                            } else {
                                val[SPECIAL_PROP] = {};//Object.create(null);
                            }
                            val[SPECIAL_PROP][SPECIAL_PROP] = objectId;
//                            console.log("oid:"+objectId);
                            objectId = objectId + 2;
                        }
                    } catch (e2) {

                    }
                    if (HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP] && typeof val[SPECIAL_PROP][SPECIAL_PROP] === 'number') {
                        value = val[SPECIAL_PROP][SPECIAL_PROP];
                    } else {
                        value = Constants.UNKNOWN;
                    }
                }
            }
            ret[F_TYPE] = typen;
            ret[F_VALUE] = value;
            return ret;
        }

        function getNumericType(val) {
            var type = typeof val;
            var typen;
            switch (type) {
                case "number":
                    typen = T_NUMBER;
                    break;
                case "boolean":
                    typen = T_BOOLEAN;
                    break;
                case "string":
                    typen = T_STRING;
                    break;
                case "object":
                    if (val === null) {
                        typen = T_NULL;
                    } else if (Array.isArray(val)) {
                        typen = T_ARRAY;
                    } else {
                        typen = T_OBJECT;
                    }
                    break;
                case "function":
                    typen = T_FUNCTION;
                    break;
                case "undefined":
                    typen = T_UNDEFINED;
                    break;
            }
            return typen;
        }


        function setLiteralId(val, HasGetterSetter) {
            var id;
            var oldVal = val;
            val = getConcrete(oldVal);
            if (!HOP(val, SPECIAL_PROP) || !val[SPECIAL_PROP]) {
                if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                    Object.defineProperty(val, SPECIAL_PROP, {
                        enumerable:false,
                        writable:true
                    });
                }
                if (Array.isArray(val))
                    val[SPECIAL_PROP] = [];
                else
                    val[SPECIAL_PROP] = {};
                val[SPECIAL_PROP][SPECIAL_PROP] = id = literalId;
                literalId = literalId + 2;
                // changes due to getter or setter method
                for (var offset in val) {
                    if (offset !== SPECIAL_PROP && offset !== SPECIAL_PROP2 && HOP(val, offset)) {
                        if (!HasGetterSetter || !hasGetterSetter(val, offset, true))
                            val[SPECIAL_PROP][offset] = val[offset];
                    }
                }
            }
            if (Globals.mode === MODE_REPLAY) {
                if (traceReader.hasFutureReference(id))
                    objectMap[id] = oldVal;
                val[SPECIAL_PROP][SPECIAL_PROP4] = oldVal;
            }
        }

        function getActualValue(recordedValue, recordedType) {
            if (recordedType === T_UNDEFINED) {
                return undefined;
            } else if (recordedType === T_NULL) {
                return null;
            } else {
                return recordedValue;
            }
        }


        function syncValue(recordedArray, replayValue, iid) {
            var oldReplayValue = replayValue, tmp;

            replayValue = getConcrete(replayValue);
            var recordedValue = recordedArray[F_VALUE], recordedType = recordedArray[F_TYPE];

            if (recordedType === T_UNDEFINED ||
                recordedType === T_NULL ||
                recordedType === T_NUMBER ||
                recordedType === T_STRING ||
                recordedType === T_BOOLEAN) {
                if ((tmp = getActualValue(recordedValue, recordedType)) !== replayValue) {
                    return tmp;
                } else {
                    return oldReplayValue;
                }
            } else {
                //var id = objectMapIndex[recordedValue];
                var obj = objectMap[recordedValue];
                var type = getNumericType(replayValue);

                if (obj === undefined) {
                    if (type === recordedType && !(HOP(replayValue, SPECIAL_PROP) && replayValue[SPECIAL_PROP])) {
                        obj = replayValue;
                    } else {
                        if (recordedType === T_OBJECT) {
                            obj = {};
                        } else if (recordedType === T_ARRAY) {
                            obj = [];
                        } else {
                            obj = function () {
                            };
                        }
                    }
                    try {
                        if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                            Object.defineProperty(obj, SPECIAL_PROP, {
                                enumerable:false,
                                writable:true
                            });
                        }
                    } catch (ex) {

                    }
                    obj[SPECIAL_PROP] = {};//Object.create(null);
                    obj[SPECIAL_PROP][SPECIAL_PROP] = recordedValue;
                    createdMockObject = true;
                    var tmp2 = ((obj === replayValue) ? oldReplayValue : obj);
                    if (recordedValue !== Constants.UNKNOWN && traceReader.hasFutureReference(recordedValue))
                        objectMap[recordedValue] = tmp2;
                    obj[SPECIAL_PROP][SPECIAL_PROP4] = tmp2;
                } else if (traceReader.canDeleteReference(recordedArray)) {
                    objectMap[recordedValue] = undefined;
                }

                return (obj === replayValue) ? oldReplayValue : obj;
            }
        }


        function logValue(iid, ret, funName) {
            ret[F_IID] = iid;
            ret[F_FUNNAME] = funName;
            ret[F_SEQ] = seqNo++;
            var line = JSON.stringify(ret, encodeNaNandInfForJSON) + "\n";
            traceWriter.logToFile(line);
        }

        function checkPath(ret, iid, fun) {
            if (ret === undefined || ret[F_IID] !== iid) {
                if (fun === N_LOG_RETURN) {
                    throw undefined;  // a native function call has thrown an exception
                } else {
                    if (Config.LOG_ALL_READS_AND_BRANCHES) {
                        console.log()
                        require('fs').writeFileSync("readAndBranchLogs.replay", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
                    }
                    seriousWarnPrint(iid, "Path deviation at record = [" + ret + "] iid = " + iid + " index = " + traceReader.getPreviousIndex());
                    throw new Error("Path deviation at record = [" + ret + "] iid = " + iid + " index = " + traceReader.getPreviousIndex());
                }
            }
        }

        function getFrameContainingVar(name) {
            var tmp = frame;
            while (tmp && !HOP(tmp, name)) {
                tmp = tmp[SPECIAL_PROP3];
            }
            if (tmp) {
                return tmp;
            } else {
                return frameStack[0]; // return global scope
            }
        }

        this.record = function (prefix) {
            var ret = [];
            ret[F_TYPE] = getNumericType(prefix);
            ret[F_VALUE] = prefix;
            logValue(0, ret, N_LOG_SPECIAL);
        };


        this.command = function (rec) {
            traceWriter.remoteLog(rec);
        };

        this.RR_getConcolicValue = function (obj) {
            var val = getConcrete(obj);
            if (val === obj && val !== undefined && val !== null && HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP]) {
                var val = val[SPECIAL_PROP][SPECIAL_PROP4];
                if (val !== undefined) {
                    return val;
                } else {
                    return obj;
                }
            } else {
                return obj;
            }
        };

        this.RR_updateRecordedObject = function (obj) {
            if (Globals.mode === MODE_REPLAY) {
                var val = getConcrete(obj);
                if (val !== obj && val !== undefined && val !== null && HOP(val, SPECIAL_PROP) && val[SPECIAL_PROP]) {
                    var id = val[SPECIAL_PROP][SPECIAL_PROP];
                    if (traceReader.hasFutureReference(id))
                        objectMap[id] = obj;
                    val[SPECIAL_PROP][SPECIAL_PROP4] = obj;
                }
            }
        };


        this.RR_evalBegin = function () {
            evalFrames.push(frame);
            frame = frameStack[0];
        };

        this.RR_evalEnd = function () {
            frame = evalFrames.pop();
        };


        this.syncPrototypeChain = function (iid, obj) {
            var proto;

            obj = getConcrete(obj);
            proto = obj.__proto__;
            var oid = this.RR_Load(iid, (proto && HOP(proto, SPECIAL_PROP) && proto[SPECIAL_PROP]) ? proto[SPECIAL_PROP][SPECIAL_PROP] : undefined, undefined);
            if (oid) {
                if (Globals.mode === MODE_RECORD) {
                    obj[SPECIAL_PROP].__proto__ = proto[SPECIAL_PROP];
                } else if (Globals.mode === MODE_REPLAY) {
                    obj.__proto__ = getConcrete(objectMap[oid]);
                }
            }
        };

        /**
         * getField
         */
        this.RR_G = function (iid, base_c, offset, val) {
            var type, tmp, mod_offset;

            offset = getConcrete(offset);
            mod_offset = (offset === '__proto__' ? SPECIAL_PROP + offset : offset);
            if (Globals.mode === MODE_RECORD) {
                if ((type = typeof base_c) === 'string' ||
                    type === 'number' ||
                    type === 'boolean') {
                    seqNo++;
                    return val;
                } else if (!HOP(base_c, SPECIAL_PROP) || !base_c[SPECIAL_PROP]) {
                    return this.RR_L(iid, val, N_LOG_GETFIELD);
                } else if ((tmp = base_c[SPECIAL_PROP][mod_offset]) === val ||
                    // TODO what is going on with this condition? This is isNaN check
                    (val !== val && tmp !== tmp)) {
                    seqNo++;
                    return val;
                } else {
                    if (HOP(base_c, offset) && !hasGetterSetter(base_c, offset, false)) {
                        // add the field to the shadow value, so we don't need to log
                        // future reads.  Only do so if the property is defined directly
                        // on the object, to avoid incorrectly adding the property to
                        // the object directly during replay (see test prototype_property.js)
                        base_c[SPECIAL_PROP][mod_offset] = val;
                        return this.RR_L(iid, val, N_LOG_GETFIELD_OWN);
                    }
                    return this.RR_L(iid, val, N_LOG_GETFIELD);
                }
            } else if (Globals.mode === MODE_REPLAY) {
                var rec;
                if ((rec = traceReader.getCurrent()) === undefined) {
                    traceReader.next();
                    return val;
                } else {
                    val = this.RR_L(iid, val, N_LOG_GETFIELD);
                    // only add direct object properties
                    if (rec[F_FUNNAME] === N_LOG_GETFIELD_OWN) {
                        // do not store ConcreteValue to __proto__
                        base_c[offset] = (offset === '__proto__') ? getConcrete(val) : val;
                    }
                    return val;
                }
            } else {
                return val;
            }
        };


        this.RR_P = function (iid, base, offset, val) {
            if (Globals.mode === MODE_RECORD) {
                var base_c = getConcrete(base);
                if (HOP(base_c, SPECIAL_PROP) && base_c[SPECIAL_PROP]) {
                    base_c[SPECIAL_PROP][getConcrete(offset)] = val;
                }
            }
        };

        this.RR_W = function (iid, name, val) {
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                getFrameContainingVar(name)[name] = val;
            }
        };

        this.RR_N = function (iid, name, val, isArgumentSync) {
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                if (isArgumentSync === false || (isArgumentSync === true && Globals.isInstrumentedCaller)) {
                    return frame[name] = val;
                } else if (isArgumentSync === true && !Globals.isInstrumentedCaller) {
                    frame[name] = undefined;
                    return this.RR_R(iid, name, val, true);
                }
            }
        };

        this.RR_R = function (iid, name, val, useTopFrame) {
            var ret, trackedVal, trackedFrame, tmp;

            if (useTopFrame || name === 'this') {
                trackedFrame = frame;
            } else {
                trackedFrame = getFrameContainingVar(name);
            }
            trackedVal = trackedFrame[name];

            if (Globals.mode === MODE_RECORD) {
                if (trackedVal === val ||
                    (val !== val && trackedVal !== trackedVal) ||
                    (name === "this" && Globals.isInstrumentedCaller && !Globals.isConstructorCall && Globals.isMethodCall)) {
                    seqNo++;
                    ret = val;
                } else {
                    trackedFrame[name] = val;
                    ret = this.RR_L(iid, val, N_LOG_READ);
                }
            } else if (Globals.mode === MODE_REPLAY) {
                if (traceReader.getCurrent() === undefined) {
                    traceReader.next();
                    if (name === "this" && Globals.isInstrumentedCaller && !Globals.isConstructorCall && Globals.isMethodCall) {
                        ret = val;
                    } else {
                        ret = trackedVal;
                    }
                } else {
                    ret = trackedFrame[name] = this.RR_L(iid, val, N_LOG_READ);
                }
            } else {
                ret = val;
            }
            return ret;
        };

        this.RR_Load = function (iid, val, sval) {
            //var ret, trackedVal, trackedFrame, tmp;
            var ret;

            if (Globals.mode === MODE_RECORD) {
                if (sval === val ||
                    (val !== val && sval !== sval)) {
                    seqNo++;
                    ret = val;
                } else {
                    ret = this.RR_L(iid, val, N_LOG_LOAD);
                }
            } else if (Globals.mode === MODE_REPLAY) {
                if (traceReader.getCurrent() === undefined) {
                    traceReader.next();
                    ret = val;
                } else {
                    ret = this.RR_L(iid, val, N_LOG_LOAD);
                }
            } else {
                ret = val;
            }
            return ret;
        };

        this.RR_Fe = function (iid, val, dis) {
            var ret;
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                frameStack.push(frame = {"this":undefined});
                frame[SPECIAL_PROP3] = val[SPECIAL_PROP3];
                if (!Globals.isInstrumentedCaller) {
                    if (Globals.mode === MODE_RECORD) {
                        var tmp = printableValue(val);
                        logValue(iid, tmp, N_LOG_FUNCTION_ENTER);
                        tmp = printableValue(dis);
                        logValue(iid, tmp, N_LOG_FUNCTION_ENTER);
                    } else if (Globals.mode === MODE_REPLAY) {
                        ret = traceReader.getAndNext();
                        checkPath(ret, iid);
                        syncValue(ret, val, iid);
                        ret = traceReader.getAndNext();
                        checkPath(ret, iid);
                        syncValue(ret, dis, iid);
                        debugPrint("Index:" + traceReader.getPreviousIndex());
                    }
                }
            }
        };

        this.RR_Fr = function (iid) {
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                frameStack.pop();
                frame = frameStack[frameStack.length - 1];
                if (Globals.mode === MODE_RECORD && frameStack.length <= 1) {
                    traceWriter.flush();
                }
            }
        };

        this.RR_Se = function (iid, val) {
            var ret;
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                frameStack.push(frame = {"this":undefined});
                frame[SPECIAL_PROP3] = frameStack[0];
                if (Globals.mode === MODE_RECORD) {
                    var tmp = printableValue(val);
                    logValue(iid, tmp, N_LOG_SCRIPT_ENTER);
                } else if (Globals.mode === MODE_REPLAY) {
                    ret = traceReader.getAndNext();
                    checkPath(ret, iid);
                    debugPrint("Index:" + traceReader.getPreviousIndex());
                }
            }
        };

        this.RR_Sr = function (iid) {
            if (Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) {
                frameStack.pop();
                frame = frameStack[frameStack.length - 1];
                if (Globals.mode === MODE_RECORD && frameStack.length <= 1) {
                    traceWriter.flush();
                    if (Config.LOG_ALL_READS_AND_BRANCHES) {
                        if (Globals.mode === MODE_RECORD && !Constants.isBrowser) {
                            require('fs').writeFileSync("readAndBranchLogs.record", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
                        }
                    }

                }
            }
            if (Constants.isBrowserReplay) {
                this.RR_replay();
            }
        };

        this.RR_H = function (iid, val) {
            var ret;
            if (Globals.mode === MODE_RECORD) {
                ret = Object.create(null);
                for (var i in val) {
                    if (i !== SPECIAL_PROP && i !== SPECIAL_PROP2 && i !== SPECIAL_PROP3) {
                        ret[i] = 1;
                    }
                }
                var tmp = [];
                tmp[F_TYPE] = getNumericType(ret);
                tmp[F_VALUE] = ret;
                logValue(iid, tmp, N_LOG_HASH);
                val = ret;
            } else if (Globals.mode === MODE_REPLAY) {
                ret = traceReader.getAndNext();
                checkPath(ret, iid);
                debugPrint("Index:" + traceReader.getPreviousIndex());
                val = ret[F_VALUE];
                ret = Object.create(null);
                for (i in val) {
                    if (HOP(val, i)) {
                        ret[i] = 1;
                    }
                }
                val = ret;
            }
            return val;
        };


        this.RR_L = function (iid, val, fun) {
            var ret, tmp, old;
            if (Globals.mode === MODE_RECORD) {
                old = createdMockObject;
                createdMockObject = false;
                tmp = printableValue(val);
                logValue(iid, tmp, fun);
                if (createdMockObject) this.syncPrototypeChain(iid, val);
                createdMockObject = old;
            } else if (Globals.mode === MODE_REPLAY) {
                ret = traceReader.getCurrent();
                checkPath(ret, iid, fun);
                traceReader.next();
                debugPrint("Index:" + traceReader.getPreviousIndex());
                old = createdMockObject;
                createdMockObject = false;
                val = syncValue(ret, val, iid);
                if (createdMockObject) this.syncPrototypeChain(iid, val);
                createdMockObject = old;
            }
            return val;
        };

        this.RR_T = function (iid, val, fun, hasGetterSetter) {
            if ((Globals.mode === MODE_RECORD || Globals.mode === MODE_REPLAY) &&
                (fun === N_LOG_ARRAY_LIT || fun === N_LOG_FUNCTION_LIT || fun === N_LOG_OBJECT_LIT || fun === N_LOG_REGEXP_LIT)) {
//                    console.log("iid:"+iid)  // uncomment for divergence
                setLiteralId(val, hasGetterSetter);
                if (fun === N_LOG_FUNCTION_LIT) {
                    if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                        Object.defineProperty(val, SPECIAL_PROP3, {
                            enumerable:false,
                            writable:true
                        });
                    }
                    val[SPECIAL_PROP3] = frame;
                }
            }
        };

        this.RR_replay = function () {
            if (Globals.mode === MODE_REPLAY) {
                while (true) {
                    var ret = traceReader.getCurrent();
                    if (typeof ret !== 'object') {
                        if (Constants.isBrowserReplay) {
                            sandbox.endExecution();
                        }
                        return;
                    }
                    var f, prefix;
                    if (ret[F_FUNNAME] === N_LOG_SPECIAL) {
                        prefix = ret[F_VALUE];
                        traceReader.next();
                        ret = traceReader.getCurrent();
                        if (sandbox.analysis && sandbox.analysis.beginExecution) {
                            sandbox.analysis.beginExecution(prefix);
                        }
                    }
                    if (ret[F_FUNNAME] === N_LOG_FUNCTION_ENTER) {
                        f = getConcrete(syncValue(ret, undefined, 0));
                        ret = traceReader.getNext();
                        var dis = syncValue(ret, undefined, 0);
                        Function.prototype.call.call(f, dis);
//                        f.call(dis);
                    } else if (ret[F_FUNNAME] === N_LOG_SCRIPT_ENTER) {
                        var path = getConcrete(syncValue(ret, undefined, 0));
                        if (Constants.isBrowserReplay) {
                            load(path);
                            return;
                        } else {
                            var pth = require('path');
                            var filep = pth.resolve(path);
                            require(filep);
                            // a browser can load a script multiple times.  So,
                            // we need to remove the script from Node's cache,
                            // in case it gets loaded again
                            require.uncache(filep);
                        }
                    } else {
                        return;
                    }
                }
            }
        };


        this.setTraceFileName = function (tFN) {
            Globals.traceFileName = tFN;
            if (traceReader) {
                traceReader.populateObjectIdLife();
            }
        }


        var tmp_LOG_ALL_READS_AND_BRANCHES = false;
        if (Globals.mode === MODE_REPLAY) {
            traceReader = new TraceReader();
            this.addRecord = traceReader.addRecord;
        } else if (Globals.mode === MODE_RECORD) {
            Globals.traceWriter = traceWriter = new TraceWriter();
            this.onflush = traceWriter.onflush;
            if (Constants.isBrowser) {
                if (!Constants.IN_MEMORY_TRACE) {
                    this.command('reset');
                }
                // enable keyboard shortcut to stop tracing
                window.addEventListener('keydown', function (e) {
                    // keyboard shortcut is Alt-Shift-T for now
                    if (e.altKey && e.shiftKey && e.keyCode === 84) {
                        traceWriter.stopTracing();
                        traceWriter.onflush(function () {
                            if (tmp_LOG_ALL_READS_AND_BRANCHES) console.save(Globals.loadAndBranchLogs, "readAndBranchLogs.record");
                            alert("trace flush complete");
                        });
                        tmp_LOG_ALL_READS_AND_BRANCHES = Config.LOG_ALL_READS_AND_BRANCHES;
                        Config.LOG_ALL_READS_AND_BRANCHES = false;
                    }
                });
            }
        }
    }

    if (!sandbox.Constants.isBrowser && typeof require === 'function') {
        /**
         * remove a loaded module from Node's cache
         * @param moduleName the name of the module
         */
        require.uncache = function (moduleName) {
            require.searchCache(moduleName, function (mod) {
                delete require.cache[mod.id];
            });
        };

        /**
         * apply an operation to a module already loaded and
         * cached by Node
         * @param moduleName the name of the module
         * @param callback the operation to perform
         */
        require.searchCache = function (moduleName, callback) {
            var mod = require.resolve(moduleName);

            if (mod && ((mod = require.cache[mod]) !== undefined)) {
                (function run(mod) {
                    mod.children.forEach(function (child) {
                        run(child);
                    });
                    callback(mod);
                })(mod);
            }
        };
    }


    //----------------------------------- End Record Replay Engine ---------------------------------
})(J$);

//----------------------------------- End Record Replay Engine ---------------------------------

/*
 * Copyright 2013 Samsung Information Systems America, Inc.
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

// Author: Koushik Sen


/*
 To perform analysis in browser without recording, set window.JALANGI_MODE to 'inbrowser' and J$.analysis to a suitable analysis file.
 In the inbrowser mode, one has access to the object J$.smemory, which denotes the shadow memory.
 smemory.getShadowObject(obj) returns the shadow object associated with obj if type of obj is "object" or "function".
 smemory.getFrame(varName) returns the activation frame that contains the variable named "varName".
 To redefine all instrumentation functions, set JALANGI_MODE to 'symbolic' and J$.analysis to a suitable library containing redefinitions of W, R, etc.

 */

/*jslint node: true browser: true */
/*global J$ alert */

// wrap in anonymous function to create local namespace when in browser
// create / reset J$ global variable to hold analysis runtime
if (typeof J$ === 'undefined') {
    J$ = {};
}

window = {String:String, Array:Array, Error:Error, Number:Number, Date:Date, Boolean:Boolean, RegExp:RegExp};

(function (sandbox) {
    var Constants = sandbox.Constants;
    var Globals = sandbox.Globals;
    var Config = sandbox.Config;
    var SMemory = sandbox.SMemory;
    var RecordReplayEngine = sandbox.RecordReplayEngine;

//    var Globals = (typeof sandbox.Globals === 'undefined'? require('./Globals.js'): sandbox.Globals);
//    var Config = (typeof sandbox.Config === 'undefined'? require('./Config.js'): sandbox.Config);
//    var RecordReplayEngine = (typeof sandbox.RecordReplayEngine === 'undefined'? require('./RecordReplayEngine.js'): sandbox.RecordReplayEngine);


    function init(mode_name, analysis_script, initSMemory) {

        var MODE_RECORD = Constants.MODE_RECORD,
            MODE_REPLAY = Constants.MODE_REPLAY,
            MODE_NO_RR_IGNORE_UNINSTRUMENTED = Constants.MODE_NO_RR_IGNORE_UNINSTRUMENTED,
            MODE_NO_RR = Constants.MODE_NO_RR,
            MODE_DIRECT = Constants.MODE_DIRECT;
        var getConcrete = Constants.getConcrete;
        var HOP = Constants.HOP;
        var EVAL_ORG = eval;
        var isBrowser = Constants.isBrowser;


        var SPECIAL_PROP = Constants.SPECIAL_PROP;
        var SPECIAL_PROP2 = Constants.SPECIAL_PROP2;
        var SPECIAL_PROP3 = Constants.SPECIAL_PROP3;

        var N_LOG_FUNCTION_LIT = Constants.N_LOG_FUNCTION_LIT,
            N_LOG_RETURN = Constants.N_LOG_RETURN,
            N_LOG_OPERATION = Constants.N_LOG_OPERATION;


        var mode = Globals.mode = (function (str) {
            switch (str) {
                case "record" :
                    return MODE_RECORD;
                case "replay":
                    return MODE_REPLAY;
                case "analysis":
                    return MODE_NO_RR_IGNORE_UNINSTRUMENTED;
                case "inbrowser":
                    return MODE_NO_RR;
                case "symbolic":
                    return MODE_DIRECT;
                default:
                    return MODE_RECORD;
            }
        })(mode_name);
        var isBrowserReplay = Globals.isBrowserReplay = Constants.isBrowser && Globals.mode === MODE_REPLAY;
        Globals.isInstrumentedCaller = false;
        Globals.isConstructorCall = false;
        Globals.isMethodCall = false;

        if (Globals.mode === MODE_DIRECT) {
            /* JALANGI_ANALYSIS file must define all instrumentation functions such as U, B, C, C1, C2, W, R, G, P */
            if (analysis_script) {
                require(require('path').resolve(analysis_script))(sandbox);
                if (sandbox.postLoad) {
                    sandbox.postLoad();
                }
            }
        } else {

            var rrEngine;
            var branchCoverageInfo;
            var smemory;


            if (mode === MODE_RECORD || mode === MODE_REPLAY) {
                rrEngine = new RecordReplayEngine();
            }
            if (initSMemory) {
                sandbox.smemory = smemory = new SMemory();
            }


            //-------------------------------------- Symbolic functions -----------------------------------------------------------

            function create_fun(f) {
                return function () {
                    var len = arguments.length;
                    for (var i = 0; i < len; i++) {
                        arguments[i] = getConcrete(arguments[i]);
                    }
                    return f.apply(getConcrete(this), arguments);
                }
            }

            function concretize(obj) {
                for (var key in obj) {
                    if (HOP(obj, key)) {
                        obj[key] = getConcrete(obj[key]);
                    }
                }
            }

            function modelDefineProperty(f) {
                return function () {
                    var len = arguments.length;
                    for (var i = 0; i < len; i++) {
                        arguments[i] = getConcrete(arguments[i]);
                    }
                    if (len === 3) {
                        concretize(arguments[2]);
                    }
                    return f.apply(getConcrete(this), arguments);
                }
            }

            function getSymbolicFunctionToInvokeAndLog(f, isConstructor) {
                if (f === Array ||
                    f === Error ||
                    f === String ||
                    f === Number ||
                    f === Date ||
                    f === Boolean ||
                    f === RegExp ||
                    f === sandbox.addAxiom ||
                    f === sandbox.readInput) {
                    return [f, true];
                } else if (//f === Function.prototype.apply ||
                //f === Function.prototype.call ||
                    f === console.log ||
                        (typeof getConcrete(arguments[0]) === 'string' && f === RegExp.prototype.test) || // fixes bug in minPathDev.js
                        f === String.prototype.indexOf ||
                        f === String.prototype.lastIndexOf ||
                        f === String.prototype.substring ||
                        f === String.prototype.substr ||
                        f === String.prototype.charCodeAt ||
                        f === String.prototype.charAt ||
                        f === String.prototype.replace ||
                        f === String.fromCharCode ||
                        f === Math.abs ||
                        f === Math.acos ||
                        f === Math.asin ||
                        f === Math.atan ||
                        f === Math.atan2 ||
                        f === Math.ceil ||
                        f === Math.cos ||
                        f === Math.exp ||
                        f === Math.floor ||
                        f === Math.log ||
                        f === Math.max ||
                        f === Math.min ||
                        f === Math.pow ||
                        f === Math.round ||
                        f === Math.sin ||
                        f === Math.sqrt ||
                        f === Math.tan ||
                        f === parseInt) {
                    return  [create_fun(f), false];
                } else if (f === Object.defineProperty) {
                    return [modelDefineProperty(f), false];
                }
                return [null, true];
            }


            //---------------------------- Utility functions -------------------------------
            function addAxiom(c) {
                if (sandbox.analysis && sandbox.analysis.installAxiom) {
                    sandbox.analysis.installAxiom(c);
                }
            }

            var loadAndBranchLogs = Globals.loadAndBranchLogs;

            function printValueForTesting(loc, iid, val) {
                if (!Config.LOG_ALL_READS_AND_BRANCHES) return;
                var type = typeof val, str;
                if (type !== 'object' && type !== 'function') {
                    str = loc + ":" + iid + ":" + type + ":" + val;
                    loadAndBranchLogs.push(str);
                } else if (val === null) {
                    str = loc + ":" + iid + ":" + type + ":" + val;
                    loadAndBranchLogs.push(str);
                } else if (HOP(val, SPECIAL_PROP) && HOP(val[SPECIAL_PROP], SPECIAL_PROP)) {
                    str = loc + ":" + iid + ":" + type + ":" + val[SPECIAL_PROP][SPECIAL_PROP];
                    loadAndBranchLogs.push(str);
                } else {
                    str = loc + ":" + iid + ":" + type + ":object";
                    loadAndBranchLogs.push(str);
                }
            }

            //---------------------------- End utility functions -------------------------------


            //----------------------------------- Begin Jalangi Library backend ---------------------------------

            // stack of return values from instrumented functions.
            // we need to keep a stack since a function may return and then
            // have another function call in a finally block (see test
            // call_in_finally.js)
            var returnVal = [];
            var exceptionVal;
            var scriptCount = 0;
            var lastVal;
            var switchLeft;
            var switchKeyStack = [];
            var argIndex;


            /**
             * invoked when the client analysis throws an exception
             * @param e
             */
            function clientAnalysisException(e) {
                console.error("analysis exception!!!");
                console.error(e.stack);
                if (isBrowser) {
                    // we don't really know what will happen to the exception,
                    // but we don't have a way to just terminate, so throw it
                    throw e;
                } else {
                    // under node.js, just die
                    process.exit(1);
                }
            }

            function isNative(f) {
                return f.toString().indexOf('[native code]') > -1 || f.toString().indexOf('[object ') === 0;
            }

            function callAsNativeConstructorWithEval(Constructor, args) {
                var a = [];
                for (var i = 0; i < args.length; i++)
                    a[i] = 'args[' + i + ']';
                var eval = EVAL_ORG;
                return eval('new Constructor(' + a.join() + ')');
            }

            function callAsNativeConstructor(Constructor, args) {
                if (args.length === 0) {
                    return new Constructor();
                }
                if (args.length === 1) {
                    return new Constructor(args[0]);
                }
                if (args.length === 2) {
                    return new Constructor(args[0], args[1]);
                }
                if (args.length === 3) {
                    return new Constructor(args[0], args[1], args[2]);
                }
                if (args.length === 4) {
                    return new Constructor(args[0], args[1], args[2], args[3]);
                }
                if (args.length === 5) {
                    return new Constructor(args[0], args[1], args[2], args[3], args[4]);
                }
                return callAsNativeConstructorWithEval(Constructor, args);
            }

            function callAsConstructor(Constructor, args) {
//                if (isNative(Constructor)) {
                if (true) {
                    var ret = callAsNativeConstructor(Constructor, args);
                    return ret;
                } else {
                    var Temp = function () {
                    }, inst, ret;
                    Temp.prototype = getConcrete(Constructor.prototype);
                    inst = new Temp;
                    ret = Constructor.apply(inst, args);
                    return Object(ret) === ret ? ret : inst;
                }
            }


            function invokeEval(base, f, args) {
                if (rrEngine) {
                    rrEngine.RR_evalBegin();
                }
                if (smemory) {
                    smemory.evalBegin();
                }
                try {
                    return f(sandbox.instrumentCode(getConcrete(args[0]), {wrapProgram:false, isEval:true}).code);
                } finally {
                    if (rrEngine) {
                        rrEngine.RR_evalEnd();
                    }
                    if (smemory) {
                        smemory.evalEnd();
                    }
                }
            }


            function invokeFun(iid, base, f, args, isConstructor, isMethod) {
                var g, invoke, val, ic, tmp_rrEngine, tmpIsConstructorCall, tmpIsInstrumentedCaller, idx, tmpIsMethodCall;

                var f_c = getConcrete(f);

                tmpIsConstructorCall = Globals.isConstructorCall;
                Globals.isConstructorCall = isConstructor;
                tmpIsMethodCall = Globals.isMethodCall;
                Globals.isMethodCall = isMethod;


                if (sandbox.analysis && sandbox.analysis.invokeFunPre) {
                    tmp_rrEngine = rrEngine;
                    rrEngine = null;
                    try {
                        sandbox.analysis.invokeFunPre(iid, f, base, args, isConstructor);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    rrEngine = tmp_rrEngine;
                }


                var arr = getSymbolicFunctionToInvokeAndLog(f_c, isConstructor);
                tmpIsInstrumentedCaller = Globals.isInstrumentedCaller;
                ic = Globals.isInstrumentedCaller = f_c === undefined || HOP(f_c, SPECIAL_PROP2) || typeof f_c !== "function";

                if (mode === MODE_RECORD || mode === MODE_NO_RR) {
                    invoke = true;
                    g = f_c;
                } else if (mode === MODE_REPLAY || mode === MODE_NO_RR_IGNORE_UNINSTRUMENTED) {
                    invoke = arr[0] || Globals.isInstrumentedCaller;
                    g = arr[0] || f_c;
                }

                pushSwitchKey();
                try {
                    if (g === EVAL_ORG) {
                        val = invokeEval(base, g, args);
                    } else if (invoke) {
                        if (isConstructor) {
                            val = callAsConstructor(g, args);
                        } else {
                            val = Function.prototype.apply.call(g, base, args);
                            //val = g.apply(base, args);
                        }
                    } else {
                        if (rrEngine) {
                            rrEngine.RR_replay();
                        }
                        val = undefined;
                    }
                } finally {
                    popSwitchKey();
                    Globals.isInstrumentedCaller = tmpIsInstrumentedCaller;
                    Globals.isConstructorCall = tmpIsConstructorCall;
                    Globals.isMethodCall = tmpIsMethodCall;
                }

                if (!ic && arr[1]) {
                    if (rrEngine) {
                        val = rrEngine.RR_L(iid, val, N_LOG_RETURN);
                    }
                }
                if (sandbox.analysis && sandbox.analysis.invokeFun) {
                    tmp_rrEngine = rrEngine;
                    rrEngine = null;
                    try {
                        val = sandbox.analysis.invokeFun(iid, f, base, args, val, isConstructor);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    rrEngine = tmp_rrEngine;
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(val);
                    }
                }
                printValueForTesting("Ret", iid, val);
                return val;
            }

            //var globalInstrumentationInfo;

            // getField (property read)
            function G(iid, base, offset, norr) {
                if (offset === SPECIAL_PROP || offset === SPECIAL_PROP2 || offset === SPECIAL_PROP3) {
                    return undefined;
                }

                var base_c = getConcrete(base);
//                if (rrEngine) {
//                    base_c = rrEngine.RR_preG(iid, base, offset);
//                }

                if (sandbox.analysis && sandbox.analysis.getFieldPre && getConcrete(offset) !== '__proto__') {
                    try {
                        sandbox.analysis.getFieldPre(iid, base, offset);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                var val = base_c[getConcrete(offset)];


                if (rrEngine && !norr) {
                    val = rrEngine.RR_G(iid, base_c, offset, val);
                }
                if (sandbox.analysis && sandbox.analysis.getField && getConcrete(offset) !== '__proto__') {
                    var tmp_rrEngine = rrEngine;
                    rrEngine = null;
                    try {
                        val = sandbox.analysis.getField(iid, base, offset, val);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    rrEngine = tmp_rrEngine;
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(val);
                    }
                }

                if (rrEngine) {
                    rrEngine.RR_replay();
                    rrEngine.RR_Load(iid);
                }

                printValueForTesting("J$.G", iid, val);
                return val;
            }

            // putField (property write)
            function P(iid, base, offset, val) {
                if (offset === SPECIAL_PROP || offset === SPECIAL_PROP2 || offset === SPECIAL_PROP3) {
                    return undefined;
                }

                // window.location.hash = hash calls a function out of nowhere.
                // fix needs a call to RR_replay and setting isInstrumentedCaller to false
                // the following patch is not elegant
                var tmpIsInstrumentedCaller = Globals.isInstrumentedCaller;
                Globals.isInstrumentedCaller = false;

                var base_c = getConcrete(base);
                if (sandbox.analysis && sandbox.analysis.putFieldPre) {
                    try {
                        val = sandbox.analysis.putFieldPre(iid, base, offset, val);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                if (typeof base_c === 'function' && getConcrete(offset) === 'prototype') {
                    base_c[getConcrete(offset)] = getConcrete(val);
                } else {
                    base_c[getConcrete(offset)] = val;
                }

                if (rrEngine) {
                    rrEngine.RR_P(iid, base, offset, val);
                }
                if (sandbox.analysis && sandbox.analysis.putField) {
                    try {
                        val = sandbox.analysis.putField(iid, base, offset, val);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                // the following patch was not elegant
                // but now it is better (got rid of offset+"" === "hash" check)
                if (rrEngine) {//} && ((offset + "") === "hash")) {
                    rrEngine.RR_replay();
                    rrEngine.RR_Load(iid); // add a dummy (no record) in the trace so that RR_Replay does not replay non-setter method
                }

                // the following patch is not elegant
                Globals.isInstrumentedCaller = tmpIsInstrumentedCaller;
                return val;
            }

            // Function call (e.g., f())
            function F(iid, f, isConstructor) {
                return function () {
                    var base = this;
                    return invokeFun(iid, base, f, arguments, isConstructor, false);
                }
            }

            // Method call (e.g., e.f())
            function M(iid, base, offset, isConstructor) {
                return function () {
                    var f = G(iid + 2, base, offset);
                    return invokeFun(iid, base, f, arguments, isConstructor, true);
                };
            }

            // Function enter
            function Fe(iid, val, dis /* this */, args) {
                argIndex = 0;
                if (rrEngine) {
                    rrEngine.RR_Fe(iid, val, dis);
                }
                if (smemory) {
                    smemory.functionEnter(val);
                }
                returnVal.push(undefined);
                exceptionVal = undefined;
                if (sandbox.analysis && sandbox.analysis.functionEnter) {
                    if (rrEngine) {
                        val = rrEngine.RR_getConcolicValue(val);
                    }
                    try {
                        sandbox.analysis.functionEnter(iid, val, dis, args);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                printValueForTesting("Call", iid, val);
            }

            // Function exit
            function Fr(iid) {
                var ret = false, tmp;
                if (rrEngine) {
                    rrEngine.RR_Fr(iid);
                }
                if (smemory) {
                    smemory.functionReturn();
                }
                if (sandbox.analysis && sandbox.analysis.functionExit) {
                    try {
                        ret = sandbox.analysis.functionExit(iid);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                // if there was an uncaught exception, throw it
                // here, to preserve exceptional control flow
                if (exceptionVal !== undefined) {
                    tmp = exceptionVal;
                    exceptionVal = undefined;
                    throw tmp;
                }
                return ret;
            }

            // Uncaught exception
            function Ex(iid, e) {
                exceptionVal = e;
            }

            // Return statement
            function Rt(iid, val) {
                returnVal.pop();
                returnVal.push(val);
                if (sandbox.analysis && sandbox.analysis.return_) {
                    try {
                        val = sandbox.analysis.return_(val);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                return val;
            }

            // Actual return from function, invoked from 'finally' block
            // added around every function by instrumentation.  Reads
            // the return value stored by call to Rt()
            function Ra() {
                var ret = returnVal.pop();
                //returnVal = undefined;
                exceptionVal = undefined;
                return ret;
            }

            // Script enter
            function Se(iid, val) {
                scriptCount++;
                if (rrEngine) {
                    rrEngine.RR_Se(iid, val);
                }
                if (smemory) {
                    smemory.scriptEnter();
                }
                if (sandbox.analysis && sandbox.analysis.scriptEnter) {
                    try {
                        sandbox.analysis.scriptEnter(iid, val);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
            }

            // Script exit
            function Sr(iid) {
                var tmp;
                scriptCount--;
                if (rrEngine) {
                    rrEngine.RR_Sr(iid);
                }
                if (smemory) {
                    smemory.scriptReturn();
                }
                if (sandbox.analysis && sandbox.analysis.scriptExit) {
                    try {
                        sandbox.analysis.scriptExit(iid);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                if (mode === MODE_NO_RR_IGNORE_UNINSTRUMENTED && scriptCount === 0) {
                    endExecution();
                }
                if (exceptionVal !== undefined) {
                    tmp = exceptionVal;
                    exceptionVal = undefined;
                    if ((mode === MODE_REPLAY && scriptCount > 0) || isBrowserReplay) {
                        throw tmp;
                    } else {
                        console.error(tmp);
                        console.error(tmp.stack);
                    }
                }
            }

            // Ignore argument (identity).
            // TODO Why do we need this?
            function I(val) {
                return val;
            }

            // object/function/regexp/array Literal
            function T(iid, val, type, hasGetterSetter) {
                if (sandbox.analysis && sandbox.analysis.literalPre) {
                    try {
                        sandbox.analysis.literalPre(iid, val, hasGetterSetter);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                if (rrEngine) {
                    rrEngine.RR_T(iid, val, type, hasGetterSetter);
                }
                if (smemory) {
                    smemory.defineFunction(val, type);
                }
                if (type === N_LOG_FUNCTION_LIT) {
                    if (Object && Object.defineProperty && typeof Object.defineProperty === 'function') {
                        Object.defineProperty(val, SPECIAL_PROP2, {
                            enumerable:false,
                            writable:true
                        });
                    }
                    val[SPECIAL_PROP2] = true;
                }

                // inform analysis, which may modify the literal
                if (sandbox.analysis && sandbox.analysis.literal) {
                    try {
                        val = sandbox.analysis.literal(iid, val, hasGetterSetter);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(val);
                    }
                }

                return val;
            }

            // hash in for-in
            // E.g., given code 'for (p in x) { ... }',
            // H is invoked with the value of x
            function H(iid, val) {
                if (rrEngine) {
                    val = rrEngine.RR_H(iid, val);
                }
                return val;
            }

            // variable read
            function R(iid, name, val, isGlobal, isPseudoGlobal) {
                if (sandbox.analysis && sandbox.analysis.readPre) {
                    try {
                        sandbox.analysis.readPre(iid, name, val, isGlobal);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                if (rrEngine && (name === 'this' || isGlobal)) {
                    val = rrEngine.RR_R(iid, name, val);
                }
                if (sandbox.analysis && sandbox.analysis.read) {
                    try {
                        val = sandbox.analysis.read(iid, name, val, isGlobal);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    if (rrEngine) {// && (name==='this' || isGlobal)) {
                        rrEngine.RR_updateRecordedObject(val);
                    }
                }
                printValueForTesting("J$.R", iid, val);
                return val;
            }

            // variable write
            function W(iid, name, val, lhs, isGlobal, isPseudoGlobal) {
                if (sandbox.analysis && sandbox.analysis.writePre) {
                    try {
                        sandbox.analysis.writePre(iid, name, val, lhs);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                if (rrEngine && isGlobal) {
                    rrEngine.RR_W(iid, name, val);
                }
                if (sandbox.analysis && sandbox.analysis.write) {
                    try {
                        val = sandbox.analysis.write(iid, name, val, lhs);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                return val;
            }

            // variable declaration (Init)
            function N(iid, name, val, isArgumentSync, isLocalSync, isCatchParam) {
                // isLocalSync is only true when we sync variables inside a for-in loop
                isCatchParam = !!isCatchParam
                if (isArgumentSync) {
                    argIndex++;
                }
                if (rrEngine) {
                    val = rrEngine.RR_N(iid, name, val, isArgumentSync);
                }
                if (!isLocalSync && !isCatchParam && smemory) {
                    smemory.initialize(name);
                }
                if (!isLocalSync && sandbox.analysis && sandbox.analysis.declare) {
                    try {
                        if (isArgumentSync && argIndex > 1) {
                            sandbox.analysis.declare(iid, name, val, isArgumentSync, argIndex - 2, isCatchParam);
                        } else {
                            sandbox.analysis.declare(iid, name, val, isArgumentSync, -1, isCatchParam);
                        }
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
                return val;
            }

            // Modify and assign +=, -= ...
            // TODO is this dead or still used?
            // definitely used --KS
            function A(iid, base, offset, op) {
                var oprnd1 = G(iid, base, offset);
                return function (oprnd2) {
                    var val = B(iid, op, oprnd1, oprnd2);
                    return P(iid, base, offset, val);
                };
            }

            // Binary operation
            function B(iid, op, left, right) {
                var left_c, right_c, result_c, isArith = false;

                if (sandbox.analysis && sandbox.analysis.binaryPre) {
                    try {
                        sandbox.analysis.binaryPre(iid, op, left, right);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                left_c = getConcrete(left);
                right_c = getConcrete(right);

                switch (op) {
                    case "+":
                        isArith = true;
                        result_c = left_c + right_c;
                        break;
                    case "-":
                        isArith = true;
                        result_c = left_c - right_c;
                        break;
                    case "*":
                        isArith = true;
                        result_c = left_c * right_c;
                        break;
                    case "/":
                        isArith = true;
                        result_c = left_c / right_c;
                        break;
                    case "%":
                        isArith = true;
                        result_c = left_c % right_c;
                        break;
                    case "<<":
                        isArith = true;
                        result_c = left_c << right_c;
                        break;
                    case ">>":
                        isArith = true;
                        result_c = left_c >> right_c;
                        break;
                    case ">>>":
                        isArith = true;
                        result_c = left_c >>> right_c;
                        break;
                    case "<":
                        isArith = true;
                        result_c = left_c < right_c;
                        break;
                    case ">":
                        isArith = true;
                        result_c = left_c > right_c;
                        break;
                    case "<=":
                        isArith = true;
                        result_c = left_c <= right_c;
                        break;
                    case ">=":
                        isArith = true;
                        result_c = left_c >= right_c;
                        break;
                    case "==":
                        result_c = left_c == right_c;
                        break;
                    case "!=":
                        result_c = left_c != right_c;
                        break;
                    case "===":
                        result_c = left_c === right_c;
                        break;
                    case "!==":
                        result_c = left_c !== right_c;
                        break;
                    case "&":
                        isArith = true;
                        result_c = left_c & right_c;
                        break;
                    case "|":
                        isArith = true;
                        result_c = left_c | right_c;
                        break;
                    case "^":
                        isArith = true;
                        result_c = left_c ^ right_c;
                        break;
                    case "instanceof":
                        result_c = left_c instanceof right_c;
                        if (rrEngine) {
                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
                        }
                        break;
                    case "delete":
                        result_c = delete left_c[right_c];
                        if (rrEngine) {
                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
                        }
                        break;
                    case "in":
                        result_c = left_c in right_c;
                        if (rrEngine) {
                            result_c = rrEngine.RR_L(iid, result_c, N_LOG_RETURN);
                        }
                        break;
                    case "&&":
                        result_c = left_c && right_c;
                        break;
                    case "||":
                        result_c = left_c || right_c;
                        break;
                    case "regexin":
                        result_c = right_c.test(left_c);
                        break;
                    default:
                        throw new Error(op + " at " + iid + " not found");
                        break;
                }

                if (rrEngine) {
                    var type1 = typeof left_c;
                    var type2 = typeof right_c;
                    var flag1 = (type1 === "object" || type1 === "function")
                        && !(left_c instanceof String)
                        && !(left_c instanceof Number)
                        && !(left_c instanceof Boolean)
                    var flag2 = (type2 === "object" || type2 === "function")
                        && !(right_c instanceof String)
                        && !(right_c instanceof Number)
                        && !(right_c instanceof Boolean)
                    if (isArith && ( flag1 || flag2)) {
                        //console.log(" type1 "+type1+" type2 "+type2+" op "+op+ " iid "+iid);
                        result_c = rrEngine.RR_L(iid, result_c, N_LOG_OPERATION);
                    }
                }
                if (sandbox.analysis && sandbox.analysis.binary) {
                    try {
                        result_c = sandbox.analysis.binary(iid, op, left, right, result_c);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(result_c);
                    }
                }
                return result_c;
            }


            // Unary operation
            function U(iid, op, left) {
                var left_c, result_c, isArith = false;

                if (sandbox.analysis && sandbox.analysis.unaryPre) {
                    try {
                        sandbox.analysis.unaryPre(iid, op, left);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                left_c = getConcrete(left);

                switch (op) {
                    case "+":
                        isArith = true;
                        result_c = +left_c;
                        break;
                    case "-":
                        isArith = true;
                        result_c = -left_c;
                        break;
                    case "~":
                        isArith = true;
                        result_c = ~left_c;
                        break;
                    case "!":
                        result_c = !left_c;
                        break;
                    case "typeof":
                        result_c = typeof left_c;
                        break;
                    default:
                        throw new Error(op + " at " + iid + " not found");
                        break;
                }

                if (rrEngine) {
                    var type1 = typeof left_c;
                    var flag1 = (type1 === "object" || type1 === "function")
                        && !(left_c instanceof String)
                        && !(left_c instanceof Number)
                        && !(left_c instanceof Boolean)
                    if (isArith && flag1) {
                        result_c = rrEngine.RR_L(iid, result_c, N_LOG_OPERATION);
                    }
                }
                if (sandbox.analysis && sandbox.analysis.unary) {
                    try {
                        result_c = sandbox.analysis.unary(iid, op, left, result_c);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(result_c);
                    }
                }
                return result_c;
            }

            function pushSwitchKey() {
                switchKeyStack.push(switchLeft);
            }

            function popSwitchKey() {
                switchLeft = switchKeyStack.pop();
            }

            function last() {
                return lastVal;
            }

            // Switch key
            // E.g., for 'switch (x) { ... }',
            // C1 is invoked with value of x
            function C1(iid, left) {
                var left_c;

                left_c = getConcrete(left);
                switchLeft = left;
                return left_c;
            }

            // case label inside switch
            function C2(iid, left) {
                var left_c, ret;

                left_c = getConcrete(left);
                left = B(iid, "===", switchLeft, left);

                if (sandbox.analysis && sandbox.analysis.conditionalPre) {
                    try {
                        sandbox.analysis.conditionalPre(iid, left);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                ret = !!getConcrete(left);

                if (sandbox.analysis && sandbox.analysis.conditional) {
                    try {
                        sandbox.analysis.conditional(iid, left, ret);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                if (branchCoverageInfo) {
                    branchCoverageInfo.updateBranchInfo(iid, ret);
                }
                printValueForTesting("J$.C2", iid, left_c ? 1 : 0);
                return left_c;
            };

            // Expression in conditional
            function C(iid, left) {
                var left_c, ret;
                if (sandbox.analysis && sandbox.analysis.conditionalPre) {
                    try {
                        sandbox.analysis.conditionalPre(iid, left);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }

                left_c = getConcrete(left);
                ret = !!left_c;

                if (sandbox.analysis && sandbox.analysis.conditional) {
                    try {
                        lastVal = sandbox.analysis.conditional(iid, left, left_c);
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                    if (rrEngine) {
                        rrEngine.RR_updateRecordedObject(lastVal);
                    }
                } else {
                    lastVal = left_c;
                }

                if (branchCoverageInfo) {
                    branchCoverageInfo.updateBranchInfo(iid, ret);
                }

                printValueForTesting("J$.C ", iid, left_c ? 1 : 0);
                return left_c;
            }

            function endExecution() {
                if (branchCoverageInfo)
                    branchCoverageInfo.storeBranchInfo();
                if (Config.LOG_ALL_READS_AND_BRANCHES) {
                    if (mode === MODE_REPLAY) {
                        require('fs').writeFileSync("readAndBranchLogs.replay", JSON.stringify(Globals.loadAndBranchLogs, undefined, 4), "utf8");
                    }
                }

                if (sandbox.analysis && sandbox.analysis.endExecution) {
                    try {
                        return sandbox.analysis.endExecution();
                    } catch (e) {
                        clientAnalysisException(e);
                    }
                }
            }


            //----------------------------------- End Jalangi Library backend ---------------------------------

            // -------------------- Monkey patch some methods ------------------------
            var GET_OWN_PROPERTY_NAMES = Object.getOwnPropertyNames;
            Object.getOwnPropertyNames = function () {
                var val = GET_OWN_PROPERTY_NAMES.apply(Object, arguments);
                var idx = val.indexOf(SPECIAL_PROP);
                if (idx > -1) {
                    val.splice(idx, 1);
                }
                idx = val.indexOf(SPECIAL_PROP2);
                if (idx > -1) {
                    val.splice(idx, 1);
                }
                idx = val.indexOf(SPECIAL_PROP3);
                if (idx > -1) {
                    val.splice(idx, 1);
                }
                return val;
            };


            (function (console) {

                console.save = function (data, filename) {

                    if (!data) {
                        console.error('Console.save: No data')
                        return;
                    }

                    if (!filename) filename = 'console.json'

                    if (typeof data === "object") {
                        data = JSON.stringify(data, undefined, 4)
                    }

                    var blob = new Blob([data], {type:'text/json'}),
                        e = document.createEvent('MouseEvents'),
                        a = document.createElement('a')

                    a.download = filename
                    a.href = window.URL.createObjectURL(blob)
                    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
                    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
                    a.dispatchEvent(e)
                }
            })(console);


            sandbox.U = U; // Unary operation
            sandbox.B = B; // Binary operation
            sandbox.C = C; // Condition
            sandbox.C1 = C1; // Switch key
            sandbox.C2 = C2; // case label C1 === C2
            sandbox.addAxiom = addAxiom; // Add axiom
            sandbox.getConcrete = getConcrete;  // Get concrete value
            sandbox._ = last;  // Last value passed to C

            sandbox.H = H; // hash in for-in
            sandbox.I = I; // Ignore argument
            sandbox.G = G; // getField
            sandbox.P = P; // putField
            sandbox.R = R; // Read
            sandbox.W = W; // Write
            sandbox.N = N; // Init
            sandbox.T = T; // object/function/regexp/array Literal
            sandbox.F = F; // Function call
            sandbox.M = M; // Method call
            sandbox.A = A; // Modify and assign +=, -= ...
            sandbox.Fe = Fe; // Function enter
            sandbox.Fr = Fr; // Function return
            sandbox.Se = Se; // Script enter
            sandbox.Sr = Sr; // Script return
            sandbox.Rt = Rt; // returned value
            sandbox.Ra = Ra;
            sandbox.Ex = Ex;

            sandbox.replay = rrEngine ? rrEngine.RR_replay : undefined;
            sandbox.onflush = rrEngine ? rrEngine.onflush : function () {
            };
            sandbox.record = rrEngine ? rrEngine.record : function () {
            };
            sandbox.command = rrEngine ? rrEngine.command : function () {
            };
            sandbox.endExecution = endExecution;
            sandbox.addRecord = rrEngine ? rrEngine.addRecord : undefined;
            sandbox.setTraceFileName = rrEngine ? rrEngine.setTraceFileName : undefined;
        }
    }


    if (Constants.isBrowser) {
        init(window.JALANGI_MODE, undefined, window.USE_SMEMORY);
    } else { // node.js
        init(global.JALANGI_MODE, global.ANALYSIS_SCRIPT, global.USE_SMEMORY);
    }

})(J$);


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
(function(b){function a(b,d){if({}.hasOwnProperty.call(a.cache,b))return a.cache[b];var e=a.resolve(b);if(!e)throw new Error('Failed to resolve module '+b);var c={id:b,require:a,filename:b,exports:{},loaded:!1,parent:d,children:[]};d&&d.children.push(c);var f=b.slice(0,b.lastIndexOf('/')+1);return a.cache[b]=c.exports,e.call(c.exports,c,c.exports,f,b),c.loaded=!0,a.cache[b]=c.exports}a.modules={},a.cache={},a.resolve=function(b){return{}.hasOwnProperty.call(a.modules,b)?a.modules[b]:void 0},a.define=function(b,c){a.modules[b]=c};var c=function(a){return a='/',{title:'browser',version:'v0.10.26',browser:!0,env:{},argv:[],nextTick:b.setImmediate||function(a){setTimeout(a,0)},cwd:function(){return a},chdir:function(b){a=b}}}();a.define('/tools/entry-point.js',function(c,d,e,f){!function(){'use strict';b.escodegen=a('/escodegen.js',c),escodegen.browser=!0}()}),a.define('/escodegen.js',function(d,c,e,f){!function(e,f,a0,D,_,q,B,l,y,v,K,Z,I,X,j,h,J,N,F,T,o,L,w,S,R){'use strict';function a5(a){switch(a.type){case e.AssignmentExpression:case e.ArrayExpression:case e.ArrayPattern:case e.BinaryExpression:case e.CallExpression:case e.ConditionalExpression:case e.ClassExpression:case e.ExportBatchSpecifier:case e.ExportSpecifier:case e.FunctionExpression:case e.Identifier:case e.ImportSpecifier:case e.Literal:case e.LogicalExpression:case e.MemberExpression:case e.MethodDefinition:case e.NewExpression:case e.ObjectExpression:case e.ObjectPattern:case e.Property:case e.SequenceExpression:case e.ThisExpression:case e.UnaryExpression:case e.UpdateExpression:case e.YieldExpression:return!0}return!1}function ah(a){switch(a.type){case e.BlockStatement:case e.BreakStatement:case e.CatchClause:case e.ContinueStatement:case e.ClassDeclaration:case e.ClassBody:case e.DirectiveStatement:case e.DoWhileStatement:case e.DebuggerStatement:case e.EmptyStatement:case e.ExpressionStatement:case e.ForStatement:case e.ForInStatement:case e.ForOfStatement:case e.FunctionDeclaration:case e.IfStatement:case e.LabeledStatement:case e.ModuleDeclaration:case e.Program:case e.ReturnStatement:case e.SwitchStatement:case e.SwitchCase:case e.ThrowStatement:case e.TryStatement:case e.VariableDeclaration:case e.VariableDeclarator:case e.WhileStatement:case e.WithStatement:return!0}return!1}function P(){return{indent:null,base:null,parse:null,comment:!1,format:{indent:{style:'    ',base:0,adjustMultilineComment:!1},newline:'\n',space:' ',json:!1,renumber:!1,hexadecimal:!1,quotes:'single',escapeless:!1,compact:!1,parentheses:!0,semicolons:!0,safeConcatenation:!1},moz:{comprehensionExpressionStartsWithAssignment:!1,starlessGenerator:!1},sourceMap:null,sourceMapRoot:null,sourceMapWithCode:!1,directive:!1,raw:!0,verbatim:null}}function M(b,a){var c='';for(a|=0;a>0;a>>>=1,b+=b)a&1&&(c+=b);return c}function a6(a){return/[\r\n]/g.test(a)}function p(b){var a=b.length;return a&&q.code.isLineTerminator(b.charCodeAt(a-1))}function G(b,d){function e(a){return typeof a==='object'&&a instanceof Object&&!(a instanceof RegExp)}var a,c;for(a in d)d.hasOwnProperty(a)&&(c=d[a],e(c)?e(b[a])?G(b[a],c):b[a]=G({},c):b[a]=c);return b}function a3(c){var b,e,a,f,d;if(c!==c)throw new Error('Numeric literal whose value is NaN');if(c<0||c===0&&1/c<0)throw new Error('Numeric literal whose value is negative');if(c===1/0)return v?'null':K?'1e400':'1e+400';if(b=''+c,!K||b.length<3)return b;e=b.indexOf('.'),!v&&b.charCodeAt(0)===48&&e===1&&(e=0,b=b.slice(1)),a=b,b=b.replace('e+','e'),f=0,(d=a.indexOf('e'))>0&&(f=+a.slice(d+1),a=a.slice(0,d)),e>=0&&(f-=a.length-e-1,a=+(a.slice(0,e)+a.slice(e+1))+''),d=0;while(a.charCodeAt(a.length+d-1)===48)--d;return d!==0&&(f-=d,a=a.slice(0,d)),f!==0&&(a+='e'+f),(a.length<b.length||Z&&c>1e12&&Math.floor(c)===c&&(a='0x'+c.toString(16)).length<b.length)&&+a===c&&(b=a),b}function V(a,b){return(a&-2)===8232?(b?'u':'\\u')+(a===8232?'2028':'2029'):a===10||a===13?(b?'':'\\')+(a===10?'n':'r'):String.fromCharCode(a)}function a1(d){var g,a,h,e,i,b,f,c;if(a=d.toString(),d.source){if(g=a.match(/\/([^/]*)$/),!g)return a;for(h=g[1],a='',f=!1,c=!1,e=0,i=d.source.length;e<i;++e)b=d.source.charCodeAt(e),c?(a+=V(b,c),c=!1):(f?b===93&&(f=!1):b===47?a+='\\':b===91&&(f=!0),a+=V(b,c),c=b===92);return'/'+a+'/'+h}return a}function a8(b,d){var c,a='\\';switch(b){case 8:a+='b';break;case 12:a+='f';break;case 9:a+='t';break;default:c=b.toString(16).toUpperCase();v||b>255?a+='u'+'0000'.slice(c.length)+c:b===0&&!q.code.isDecimalDigit(d)?a+='0':b===11?a+='x0B':a+='x'+'00'.slice(c.length)+c;break}return a}function ad(b){var a='\\';switch(b){case 92:a+='\\';break;case 10:a+='n';break;case 13:a+='r';break;case 8232:a+='u2028';break;case 8233:a+='u2029';break;default:throw new Error('Incorrectly classified character')}return a}function ae(d){var a,e,c,b;for(b=I==='double'?'"':"'",a=0,e=d.length;a<e;++a){if(c=d.charCodeAt(a),c===39){b='"';break}if(c===34){b="'";break}c===92&&++a}return b+d+b}function af(d){var b='',c,g,a,h=0,i=0,e,f;for(c=0,g=d.length;c<g;++c){if(a=d.charCodeAt(c),a===39)++h;else if(a===34)++i;else if(a===47&&v)b+='\\';else if(q.code.isLineTerminator(a)||a===92){b+=ad(a);continue}else if(v&&a<32||!(v||X||a>=32&&a<=126)){b+=a8(a,d.charCodeAt(c+1));continue}b+=String.fromCharCode(a)}if(e=!(I==='double'||I==='auto'&&i<h),f=e?"'":'"',!(e?h:i))return f+b+f;for(d=b,b=f,c=0,g=d.length;c<g;++c)a=d.charCodeAt(c),(a===39&&e||a===34&&!e)&&(b+='\\'),b+=String.fromCharCode(a);return b+f}function O(d){var a,e,b,c='';for(a=0,e=d.length;a<e;++a)b=d[a],c+=B(b)?O(b):b;return c}function k(b,a){if(!w)return B(b)?O(b):b;if(a==null)if(b instanceof D)return b;else a={};return a.loc==null?new D(null,null,w,b,a.name||null):new D(a.loc.start.line,a.loc.start.column,w===!0?a.loc.source||null:w,b,a.name||null)}function s(){return h?h:' '}function i(c,d){var e,f,a,b;return e=k(c).toString(),e.length===0?[d]:(f=k(d).toString(),f.length===0?[c]:(a=e.charCodeAt(e.length-1),b=f.charCodeAt(0),(a===43||a===45)&&a===b||q.code.isIdentifierPart(a)&&q.code.isIdentifierPart(b)||a===47&&b===105?[c,s(),d]:q.code.isWhiteSpace(a)||q.code.isLineTerminator(a)||q.code.isWhiteSpace(b)||q.code.isLineTerminator(b)?[c,d]:[c,h,d]))}function u(a){return[l,a]}function n(c){var a,b;return a=l,l+=y,b=c.call(this,l),l=a,b}function a9(b){var a;for(a=b.length-1;a>=0;--a)if(q.code.isLineTerminator(b.charCodeAt(a)))break;return b.length-1-a}function ac(j,i){var b,a,e,g,d,c,f,h;for(b=j.split(/\r\n|[\r\n]/),c=Number.MAX_VALUE,a=1,e=b.length;a<e;++a){g=b[a],d=0;while(d<g.length&&q.code.isWhiteSpace(g.charCodeAt(d)))++d;c>d&&(c=d)}for(i!==void 0?(f=l,b[1][c]==='*'&&(i+=' '),l=i):(c&1&&--c,f=l),a=1,e=b.length;a<e;++a)h=k(u(b[a].slice(c))),b[a]=w?h.join(''):h;return l=f,b.join('\n')}function H(a,b){return a.type==='Line'?p(a.value)?'//'+a.value:'//'+a.value+'\n':o.format.indent.adjustMultilineComment&&/[\n\r]/.test(a.value)?ac('/*'+a.value+'*/',b):'/*'+a.value+'*/'}function Q(b,a){var c,f,d,i,j,h,g;if(b.leadingComments&&b.leadingComments.length>0){for(i=a,d=b.leadingComments[0],a=[],F&&b.type===e.Program&&b.body.length===0&&a.push('\n'),a.push(H(d)),p(k(a).toString())||a.push('\n'),c=1,f=b.leadingComments.length;c<f;++c)d=b.leadingComments[c],g=[H(d)],p(k(g).toString())||g.push('\n'),a.push(u(g));a.push(u(i))}if(b.trailingComments)for(j=!p(k(a).toString()),h=M(' ',a9(k([l,a,y]).toString())),c=0,f=b.trailingComments.length;c<f;++c)d=b.trailingComments[c],j?(c===0?a=[a,y]:a=[a,h],a.push(H(d,h))):a=[a,u(H(d))],c!==f-1&&!p(k(a).toString())&&(a=[a,'\n']);return a}function r(a,b,c){return b<c?['(',a,')']:a}function t(a,f,c){var d,b;return b=!o.comment||!a.leadingComments,a.type===e.BlockStatement&&b?[h,m(a,{functionBody:c})]:a.type===e.EmptyStatement&&b?';':(n(function(){d=[j,u(m(a,{semicolonOptional:f,functionBody:c}))]}),d)}function z(c,a){var b=p(k(a).toString());return c.type===e.BlockStatement&&!(o.comment&&c.leadingComments)&&!b?[a,h]:b?[a,l]:[a,j,l]}function U(d){var a,c,b;for(b=d.split(/\r\n|\n/),a=1,c=b.length;a<c;a++)b[a]=j+l+b[a];return b}function a4(c,d){var a,b,e;return a=c[o.verbatim],typeof a==='string'?b=r(U(a),f.Sequence,d.precedence):(b=U(a.content),e=a.precedence!=null?a.precedence:f.Sequence,b=r(b,e,d.precedence)),k(b,c)}function A(a){return k(a.name,a)}function W(a,c){var b;return a.type===e.Identifier?b=A(a):b=g(a,{precedence:c.precedence,allowIn:c.allowIn,allowCall:!0}),b}function a7(a){var c,d,b,g;if(g=!1,a.type===e.ArrowFunctionExpression&&!a.rest&&(!a.defaults||a.defaults.length===0)&&a.params.length===1&&a.params[0].type===e.Identifier)b=[A(a.params[0])];else{for(b=['('],a.defaults&&(g=!0),c=0,d=a.params.length;c<d;++c)g&&a.defaults[c]?b.push($(a.params[c],a.defaults[c],'=',{precedence:f.Assignment,allowIn:!0,allowCall:!0})):b.push(W(a.params[c],{precedence:f.Assignment,allowIn:!0,allowCall:!0})),c+1<d&&b.push(','+h);a.rest&&(a.params.length&&b.push(','+h),b.push('...'),b.push(A(a.rest,{precedence:f.Assignment,allowIn:!0,allowCall:!0}))),b.push(')')}return b}function x(b){var a,c;return a=a7(b),b.type===e.ArrowFunctionExpression&&(a.push(h),a.push('=>')),b.expression?(a.push(h),c=g(b.body,{precedence:f.Assignment,allowIn:!0,allowCall:!0}),c.toString().charAt(0)==='{'&&(c=['(',c,')']),a.push(c)):a.push(t(b.body,!1,!0)),a}function Y(c,b,d){var a=['for'+h+'('];return n(function(){b.left.type===e.VariableDeclaration?n(function(){a.push(b.left.kind+s()),a.push(m(b.left.declarations[0],{allowIn:!1}))}):a.push(g(b.left,{precedence:f.Call,allowIn:!0,allowCall:!0})),a=i(a,c),a=[i(a,g(b.right,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),')']}),a.push(t(b.body,d)),a}function aa(c,i,d){function f(){for(b=c.declarations[0],o.comment&&b.leadingComments?(a.push('\n'),a.push(u(m(b,{allowIn:d})))):(a.push(s()),a.push(m(b,{allowIn:d}))),e=1,g=c.declarations.length;e<g;++e)b=c.declarations[e],o.comment&&b.leadingComments?(a.push(','+j),a.push(u(m(b,{allowIn:d})))):(a.push(','+h),a.push(m(b,{allowIn:d})))}var a,e,g,b;return a=[c.kind],c.declarations.length>1?n(f):f(),a.push(i),a}function ab(b){var a=['{',j];return n(function(h){var c,d;for(c=0,d=b.body.length;c<d;++c)a.push(h),a.push(g(b.body[c],{precedence:f.Sequence,allowIn:!0,allowCall:!0,type:e.Property})),c+1<d&&a.push(j)}),p(k(a).toString())||a.push(j),a.push(l),a.push('}'),a}function E(a){var b;if(a.hasOwnProperty('raw')&&L&&o.raw)try{if(b=L(a.raw).body[0].expression,b.type===e.Literal&&b.value===a.value)return a.raw}catch(a){}return a.value===null?'null':typeof a.value==='string'?af(a.value):typeof a.value==='number'?a3(a.value):typeof a.value==='boolean'?a.value?'true':'false':a1(a.value)}function C(c,b,d){var a=[];return b&&a.push('['),a.push(g(c,d)),b&&a.push(']'),a}function $(d,e,i,c){var a,b;return b=c.precedence,a=c.allowIn||f.Assignment<b,r([g(d,{precedence:f.Call,allowIn:a,allowCall:!0}),h+i+h,g(e,{precedence:f.Assignment,allowIn:a,allowCall:!0})],f.Assignment,b)}function g(b,y){var a,v,G,B,d,t,c,u,D,z,I,w,F,K,H,L;if(v=y.precedence,w=y.allowIn,F=y.allowCall,G=b.type||y.type,o.verbatim&&b.hasOwnProperty(o.verbatim))return a4(b,y);switch(G){case e.SequenceExpression:a=[];w|=f.Sequence<v;for(d=0,t=b.expressions.length;d<t;++d)a.push(g(b.expressions[d],{precedence:f.Assignment,allowIn:w,allowCall:!0})),d+1<t&&a.push(','+h);a=r(a,f.Sequence,v);break;case e.AssignmentExpression:a=$(b.left,b.right,b.operator,y);break;case e.ArrowFunctionExpression:w|=f.ArrowFunction<v;a=r(x(b),f.ArrowFunction,v);break;case e.ConditionalExpression:w|=f.Conditional<v;a=r([g(b.test,{precedence:f.LogicalOR,allowIn:w,allowCall:!0}),h+'?'+h,g(b.consequent,{precedence:f.Assignment,allowIn:w,allowCall:!0}),h+':'+h,g(b.alternate,{precedence:f.Assignment,allowIn:w,allowCall:!0})],f.Conditional,v);break;case e.LogicalExpression:case e.BinaryExpression:B=a0[b.operator];w|=B<v;c=g(b.left,{precedence:B,allowIn:w,allowCall:!0});z=c.toString();z.charCodeAt(z.length-1)===47&&q.code.isIdentifierPart(b.operator.charCodeAt(0))?a=[c,s(),b.operator]:a=i(c,b.operator);c=g(b.right,{precedence:B+1,allowIn:w,allowCall:!0});b.operator==='/'&&c.toString().charAt(0)==='/'||b.operator.slice(-1)==='<'&&c.toString().slice(0,3)==='!--'?(a.push(s()),a.push(c)):a=i(a,c);b.operator==='in'&&!w?a=['(',a,')']:a=r(a,B,v);break;case e.CallExpression:a=[g(b.callee,{precedence:f.Call,allowIn:!0,allowCall:!0,allowUnparenthesizedNew:!1})];a.push('(');for(d=0,t=b['arguments'].length;d<t;++d)a.push(g(b['arguments'][d],{precedence:f.Assignment,allowIn:!0,allowCall:!0})),d+1<t&&a.push(','+h);a.push(')');F?a=r(a,f.Call,v):a=['(',a,')'];break;case e.NewExpression:t=b['arguments'].length;K=y.allowUnparenthesizedNew===undefined||y.allowUnparenthesizedNew;a=i('new',g(b.callee,{precedence:f.New,allowIn:!0,allowCall:!1,allowUnparenthesizedNew:K&&!J&&t===0}));if(!K||J||t>0){for(a.push('('),d=0;d<t;++d)a.push(g(b['arguments'][d],{precedence:f.Assignment,allowIn:!0,allowCall:!0})),d+1<t&&a.push(','+h);a.push(')')}a=r(a,f.New,v);break;case e.MemberExpression:a=[g(b.object,{precedence:f.Call,allowIn:!0,allowCall:F,allowUnparenthesizedNew:!1})];b.computed?(a.push('['),a.push(g(b.property,{precedence:f.Sequence,allowIn:!0,allowCall:F})),a.push(']')):(b.object.type===e.Literal&&typeof b.object.value==='number'&&(c=k(a).toString(),c.indexOf('.')<0&&!/[eExX]/.test(c)&&q.code.isDecimalDigit(c.charCodeAt(c.length-1))&&!(c.length>=2&&c.charCodeAt(0)===48)&&a.push('.')),a.push('.'),a.push(A(b.property)));a=r(a,f.Member,v);break;case e.UnaryExpression:c=g(b.argument,{precedence:f.Unary,allowIn:!0,allowCall:!0});h===''?a=i(b.operator,c):(a=[b.operator],b.operator.length>2?a=i(a,c):(z=k(a).toString(),D=z.charCodeAt(z.length-1),I=c.toString().charCodeAt(0),(D===43||D===45)&&D===I||q.code.isIdentifierPart(D)&&q.code.isIdentifierPart(I)?(a.push(s()),a.push(c)):a.push(c)));a=r(a,f.Unary,v);break;case e.YieldExpression:b.delegate?a='yield*':a='yield';b.argument&&(a=i(a,g(b.argument,{precedence:f.Yield,allowIn:!0,allowCall:!0})));a=r(a,f.Yield,v);break;case e.UpdateExpression:b.prefix?a=r([b.operator,g(b.argument,{precedence:f.Unary,allowIn:!0,allowCall:!0})],f.Unary,v):a=r([g(b.argument,{precedence:f.Postfix,allowIn:!0,allowCall:!0}),b.operator],f.Postfix,v);break;case e.FunctionExpression:L=b.generator&&!o.moz.starlessGenerator;a=L?'function*':'function';b.id?a=[a,L?h:s(),A(b.id),x(b)]:a=[a+h,x(b)];break;case e.ExportBatchSpecifier:a='*';break;case e.ArrayPattern:case e.ArrayExpression:if(!b.elements.length){a='[]';break}u=b.elements.length>1;a=['[',u?j:''];n(function(c){for(d=0,t=b.elements.length;d<t;++d)b.elements[d]?(a.push(u?c:''),a.push(g(b.elements[d],{precedence:f.Assignment,allowIn:!0,allowCall:!0}))):(u&&a.push(c),d+1===t&&a.push(',')),d+1<t&&a.push(','+(u?j:h))});u&&!p(k(a).toString())&&a.push(j);a.push(u?l:'');a.push(']');break;case e.ClassExpression:a=['class'];b.id&&(a=i(a,g(b.id,{allowIn:!0,allowCall:!0})));b.superClass&&(c=i('extends',g(b.superClass,{precedence:f.Assignment,allowIn:!0,allowCall:!0})),a=i(a,c));a.push(h);a.push(m(b.body,{semicolonOptional:!0,directiveContext:!1}));break;case e.MethodDefinition:b['static']?a=['static'+h]:a=[];b.kind==='get'||b.kind==='set'?a=i(a,[i(b.kind,C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),x(b.value)]):(c=[C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),x(b.value)],b.value.generator?(a.push('*'),a.push(c)):a=i(a,c));break;case e.Property:b.kind==='get'||b.kind==='set'?a=[b.kind,s(),C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),x(b.value)]:b.shorthand?a=C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0}):b.method?(a=[],b.value.generator&&a.push('*'),a.push(C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),a.push(x(b.value))):a=[C(b.key,b.computed,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),':'+h,g(b.value,{precedence:f.Assignment,allowIn:!0,allowCall:!0})];break;case e.ObjectExpression:if(!b.properties.length){a='{}';break}u=b.properties.length>1;n(function(){c=g(b.properties[0],{precedence:f.Sequence,allowIn:!0,allowCall:!0,type:e.Property})});if(!(u||a6(k(c).toString()))){a=['{',h,c,h,'}'];break}n(function(h){if(a=['{',j,h,c],u)for(a.push(','+j),d=1,t=b.properties.length;d<t;++d)a.push(h),a.push(g(b.properties[d],{precedence:f.Sequence,allowIn:!0,allowCall:!0,type:e.Property})),d+1<t&&a.push(','+j)});p(k(a).toString())||a.push(j);a.push(l);a.push('}');break;case e.ObjectPattern:if(!b.properties.length){a='{}';break}u=!1;if(b.properties.length===1)H=b.properties[0],H.value.type!==e.Identifier&&(u=!0);else for(d=0,t=b.properties.length;d<t;++d)if(H=b.properties[d],!H.shorthand){u=!0;break}a=['{',u?j:''];n(function(c){for(d=0,t=b.properties.length;d<t;++d)a.push(u?c:''),a.push(g(b.properties[d],{precedence:f.Sequence,allowIn:!0,allowCall:!0})),d+1<t&&a.push(','+(u?j:h))});u&&!p(k(a).toString())&&a.push(j);a.push(u?l:'');a.push('}');break;case e.ThisExpression:a='this';break;case e.Identifier:a=A(b);break;case e.ImportSpecifier:case e.ExportSpecifier:a=[b.id.name];b.name&&a.push(s()+'as'+s()+b.name.name);break;case e.Literal:a=E(b);break;case e.GeneratorExpression:case e.ComprehensionExpression:a=G===e.GeneratorExpression?['(']:['['];o.moz.comprehensionExpressionStartsWithAssignment&&(c=g(b.body,{precedence:f.Assignment,allowIn:!0,allowCall:!0}),a.push(c));b.blocks&&n(function(){for(d=0,t=b.blocks.length;d<t;++d)c=g(b.blocks[d],{precedence:f.Sequence,allowIn:!0,allowCall:!0}),d>0||o.moz.comprehensionExpressionStartsWithAssignment?a=i(a,c):a.push(c)});b.filter&&(a=i(a,'if'+h),c=g(b.filter,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),a=i(a,['(',c,')']));o.moz.comprehensionExpressionStartsWithAssignment||(c=g(b.body,{precedence:f.Assignment,allowIn:!0,allowCall:!0}),a=i(a,c));a.push(G===e.GeneratorExpression?')':']');break;case e.ComprehensionBlock:b.left.type===e.VariableDeclaration?c=[b.left.kind,s(),m(b.left.declarations[0],{allowIn:!1})]:c=g(b.left,{precedence:f.Call,allowIn:!0,allowCall:!0});c=i(c,b.of?'of':'in');c=i(c,g(b.right,{precedence:f.Sequence,allowIn:!0,allowCall:!0}));a=['for'+h+'(',c,')'];break;case e.SpreadElement:a=['...',g(b.argument,{precedence:f.Assignment,allowIn:!0,allowCall:!0})];break;case e.TaggedTemplateExpression:a=[g(b.tag,{precedence:f.Call,allowIn:!0,allowCall:F,allowUnparenthesizedNew:!1}),g(b.quasi,{precedence:f.Primary})];a=r(a,f.TaggedTemplate,v);break;case e.TemplateElement:a=b.value.raw;break;case e.TemplateLiteral:a=['`'];for(d=0,t=b.quasis.length;d<t;++d)a.push(g(b.quasis[d],{precedence:f.Primary,allowIn:!0,allowCall:!0})),d+1<t&&(a.push('${'+h),a.push(g(b.expressions[d],{precedence:f.Sequence,allowIn:!0,allowCall:!0})),a.push(h+'}'));a.push('`');break;default:throw new Error('Unknown expression type: '+b.type)}return o.comment&&(a=Q(b,a)),k(a,b)}function ag(b,d){var a,c;return b.specifiers.length===0?['import',h,E(b.source),d]:(a=['import'],c=0,b.specifiers[0]['default']&&(a=i(a,[b.specifiers[0].id.name]),++c),b.specifiers[c]&&(c!==0&&a.push(','),a.push(h+'{'),b.specifiers.length-c===1?(a.push(h),a.push(g(b.specifiers[c],{precedence:f.Sequence,allowIn:!0,allowCall:!0})),a.push(h+'}'+h)):(n(function(h){var d,e;for(a.push(j),d=c,e=b.specifiers.length;d<e;++d)a.push(h),a.push(g(b.specifiers[d],{precedence:f.Sequence,allowIn:!0,allowCall:!0})),d+1<e&&a.push(','+j)}),p(k(a).toString())||a.push(j),a.push(l+'}'+h))),a=i(a,['from'+h,E(b.source),d]),a)}function m(b,y){var c,q,a,v,G,D,r,d,H,C;v=!0,d=';',G=!1,D=!1,y&&(v=y.allowIn===undefined||y.allowIn,!N&&y.semicolonOptional===!0&&(d=''),G=y.functionBody,D=y.directiveContext);switch(b.type){case e.BlockStatement:a=['{',j];n(function(){for(c=0,q=b.body.length;c<q;++c)r=u(m(b.body[c],{semicolonOptional:c===q-1,directiveContext:G})),a.push(r),p(k(r).toString())||a.push(j)});a.push(u('}'));break;case e.BreakStatement:b.label?a='break '+b.label.name+d:a='break'+d;break;case e.ContinueStatement:b.label?a='continue '+b.label.name+d:a='continue'+d;break;case e.ClassBody:a=ab(b);break;case e.ClassDeclaration:a=['class '+b.id.name];b.superClass&&(r=i('extends',g(b.superClass,{precedence:f.Assignment,allowIn:!0,allowCall:!0})),a=i(a,r));a.push(h);a.push(m(b.body,{semicolonOptional:!0,directiveContext:!1}));break;case e.DirectiveStatement:o.raw&&b.raw?a=b.raw+d:a=ae(b.directive)+d;break;case e.DoWhileStatement:a=i('do',t(b.body));a=z(b.body,a);a=i(a,['while'+h+'(',g(b.test,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')'+d]);break;case e.CatchClause:n(function(){var c;a=['catch'+h+'(',g(b.param,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')'],b.guard&&(c=g(b.guard,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),a.splice(2,0,' if ',c))});a.push(t(b.body));break;case e.DebuggerStatement:a='debugger'+d;break;case e.EmptyStatement:a=';';break;case e.ExportDeclaration:a=['export'];if(b['default']){a=i(a,'default'),a=i(a,g(b.declaration,{precedence:f.Assignment,allowIn:!0,allowCall:!0})+d);break}if(b.specifiers){b.specifiers.length===0?a=i(a,'{'+h+'}'):b.specifiers[0].type===e.ExportBatchSpecifier?a=i(a,g(b.specifiers[0],{precedence:f.Sequence,allowIn:!0,allowCall:!0})):(a=i(a,'{'),n(function(e){var c,d;for(a.push(j),c=0,d=b.specifiers.length;c<d;++c)a.push(e),a.push(g(b.specifiers[c],{precedence:f.Sequence,allowIn:!0,allowCall:!0})),c+1<d&&a.push(','+j)}),p(k(a).toString())||a.push(j),a.push(l+'}')),b.source?a=i(a,['from'+h,E(b.source),d]):a.push(d);break}b.declaration&&(a=i(a,m(b.declaration,{semicolonOptional:d===''})));break;case e.ExpressionStatement:a=[g(b.expression,{precedence:f.Sequence,allowIn:!0,allowCall:!0})];r=k(a).toString();r.charAt(0)==='{'||r.slice(0,5)==='class'&&' {'.indexOf(r.charAt(5))>=0||r.slice(0,8)==='function'&&'* ('.indexOf(r.charAt(8))>=0||T&&D&&b.expression.type===e.Literal&&typeof b.expression.value==='string'?a=['(',a,')'+d]:a.push(d);break;case e.ImportDeclaration:a=ag(b,d);break;case e.VariableDeclarator:b.init?a=[g(b.id,{precedence:f.Assignment,allowIn:v,allowCall:!0}),h,'=',h,g(b.init,{precedence:f.Assignment,allowIn:v,allowCall:!0})]:a=W(b.id,{precedence:f.Assignment,allowIn:v});break;case e.VariableDeclaration:a=aa(b,d,v);break;case e.ThrowStatement:a=[i('throw',g(b.argument,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),d];break;case e.TryStatement:a=['try',t(b.block)];a=z(b.block,a);if(b.handlers)for(c=0,q=b.handlers.length;c<q;++c)a=i(a,m(b.handlers[c])),(b.finalizer||c+1!==q)&&(a=z(b.handlers[c].body,a));else{for(C=b.guardedHandlers||[],c=0,q=C.length;c<q;++c)a=i(a,m(C[c])),(b.finalizer||c+1!==q)&&(a=z(C[c].body,a));if(b.handler)if(B(b.handler))for(c=0,q=b.handler.length;c<q;++c)a=i(a,m(b.handler[c])),(b.finalizer||c+1!==q)&&(a=z(b.handler[c].body,a));else a=i(a,m(b.handler)),b.finalizer&&(a=z(b.handler.body,a))}b.finalizer&&(a=i(a,['finally',t(b.finalizer)]));break;case e.SwitchStatement:n(function(){a=['switch'+h+'(',g(b.discriminant,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')'+h+'{'+j]});if(b.cases)for(c=0,q=b.cases.length;c<q;++c)r=u(m(b.cases[c],{semicolonOptional:c===q-1})),a.push(r),p(k(r).toString())||a.push(j);a.push(u('}'));break;case e.SwitchCase:n(function(){for(b.test?a=[i('case',g(b.test,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),':']:a=['default:'],c=0,q=b.consequent.length,q&&b.consequent[0].type===e.BlockStatement&&(r=t(b.consequent[0]),a.push(r),c=1),c!==q&&!p(k(a).toString())&&a.push(j);c<q;++c)r=u(m(b.consequent[c],{semicolonOptional:c===q-1&&d===''})),a.push(r),c+1!==q&&!p(k(r).toString())&&a.push(j)});break;case e.IfStatement:n(function(){a=['if'+h+'(',g(b.test,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')']});b.alternate?(a.push(t(b.consequent)),a=z(b.consequent,a),b.alternate.type===e.IfStatement?a=i(a,['else ',m(b.alternate,{semicolonOptional:d===''})]):a=i(a,i('else',t(b.alternate,d==='')))):a.push(t(b.consequent,d===''));break;case e.ForStatement:n(function(){a=['for'+h+'('],b.init?b.init.type===e.VariableDeclaration?a.push(m(b.init,{allowIn:!1})):(a.push(g(b.init,{precedence:f.Sequence,allowIn:!1,allowCall:!0})),a.push(';')):a.push(';'),b.test?(a.push(h),a.push(g(b.test,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),a.push(';')):a.push(';'),b.update?(a.push(h),a.push(g(b.update,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),a.push(')')):a.push(')')});a.push(t(b.body,d===''));break;case e.ForInStatement:a=Y('in',b,d==='');break;case e.ForOfStatement:a=Y('of',b,d==='');break;case e.LabeledStatement:a=[b.label.name+':',t(b.body,d==='')];break;case e.ModuleDeclaration:a=['module',s(),b.id.name,s(),'from',h,E(b.source),d];break;case e.Program:q=b.body.length;a=[F&&q>0?'\n':''];for(c=0;c<q;++c)r=u(m(b.body[c],{semicolonOptional:!F&&c===q-1,directiveContext:!0})),a.push(r),c+1<q&&!p(k(r).toString())&&a.push(j);break;case e.FunctionDeclaration:H=b.generator&&!o.moz.starlessGenerator;a=[H?'function*':'function',H?h:s(),A(b.id),x(b)];break;case e.ReturnStatement:b.argument?a=[i('return',g(b.argument,{precedence:f.Sequence,allowIn:!0,allowCall:!0})),d]:a=['return'+d];break;case e.WhileStatement:n(function(){a=['while'+h+'(',g(b.test,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')']});a.push(t(b.body,d===''));break;case e.WithStatement:n(function(){a=['with'+h+'(',g(b.object,{precedence:f.Sequence,allowIn:!0,allowCall:!0}),')']});a.push(t(b.body,d===''));break;default:throw new Error('Unknown statement type: '+b.type)}return o.comment&&(a=Q(b,a)),r=k(a).toString(),b.type===e.Program&&!F&&j===''&&r.charAt(r.length-1)==='\n'&&(a=w?k(a).replaceRight(/\s+$/,''):r.replace(/\s+$/,'')),k(a,b)}function ai(a){if(ah(a))return m(a);if(a5(a))return g(a,{precedence:f.Sequence,allowIn:!0,allowCall:!0});throw new Error('Unknown node type: '+a.type)}function a2(k,e){var g=P(),i,f;return e!=null?(typeof e.indent==='string'&&(g.format.indent.style=e.indent),typeof e.base==='number'&&(g.format.indent.base=e.base),e=G(g,e),y=e.format.indent.style,typeof e.base==='string'?l=e.base:l=M(y,e.format.indent.base)):(e=g,y=e.format.indent.style,l=M(y,e.format.indent.base)),v=e.format.json,K=e.format.renumber,Z=v?!1:e.format.hexadecimal,I=v?'double':e.format.quotes,X=e.format.escapeless,j=e.format.newline,h=e.format.space,e.format.compact&&(j=h=y=l=''),J=e.format.parentheses,N=e.format.semicolons,F=e.format.safeConcatenation,T=e.directive,L=v?null:e.parse,w=e.sourceMap,o=e,w&&(c.browser?D=b.sourceMap.SourceNode:D=a('/node_modules/source-map/lib/source-map.js',d).SourceNode),i=ai(k),w?(f=i.toStringWithSourceMap({file:e.file,sourceRoot:e.sourceMapRoot}),e.sourceContent&&f.map.setSourceContent(e.sourceMap,e.sourceContent),e.sourceMapWithCode?f:f.map.toString()):(f={code:i.toString(),map:null},e.sourceMapWithCode?f:f.code)}_=a('/node_modules/estraverse/estraverse.js',d),q=a('/node_modules/esutils/lib/utils.js',d),e={AssignmentExpression:'AssignmentExpression',ArrayExpression:'ArrayExpression',ArrayPattern:'ArrayPattern',ArrowFunctionExpression:'ArrowFunctionExpression',BlockStatement:'BlockStatement',BinaryExpression:'BinaryExpression',BreakStatement:'BreakStatement',CallExpression:'CallExpression',CatchClause:'CatchClause',ClassBody:'ClassBody',ClassDeclaration:'ClassDeclaration',ClassExpression:'ClassExpression',ComprehensionBlock:'ComprehensionBlock',ComprehensionExpression:'ComprehensionExpression',ConditionalExpression:'ConditionalExpression',ContinueStatement:'ContinueStatement',DirectiveStatement:'DirectiveStatement',DoWhileStatement:'DoWhileStatement',DebuggerStatement:'DebuggerStatement',EmptyStatement:'EmptyStatement',ExportBatchSpecifier:'ExportBatchSpecifier',ExportDeclaration:'ExportDeclaration',ExportSpecifier:'ExportSpecifier',ExpressionStatement:'ExpressionStatement',ForStatement:'ForStatement',ForInStatement:'ForInStatement',ForOfStatement:'ForOfStatement',FunctionDeclaration:'FunctionDeclaration',FunctionExpression:'FunctionExpression',GeneratorExpression:'GeneratorExpression',Identifier:'Identifier',IfStatement:'IfStatement',ImportSpecifier:'ImportSpecifier',ImportDeclaration:'ImportDeclaration',Literal:'Literal',LabeledStatement:'LabeledStatement',LogicalExpression:'LogicalExpression',MemberExpression:'MemberExpression',MethodDefinition:'MethodDefinition',ModuleDeclaration:'ModuleDeclaration',NewExpression:'NewExpression',ObjectExpression:'ObjectExpression',ObjectPattern:'ObjectPattern',Program:'Program',Property:'Property',ReturnStatement:'ReturnStatement',SequenceExpression:'SequenceExpression',SpreadElement:'SpreadElement',SwitchStatement:'SwitchStatement',SwitchCase:'SwitchCase',TaggedTemplateExpression:'TaggedTemplateExpression',TemplateElement:'TemplateElement',TemplateLiteral:'TemplateLiteral',ThisExpression:'ThisExpression',ThrowStatement:'ThrowStatement',TryStatement:'TryStatement',UnaryExpression:'UnaryExpression',UpdateExpression:'UpdateExpression',VariableDeclaration:'VariableDeclaration',VariableDeclarator:'VariableDeclarator',WhileStatement:'WhileStatement',WithStatement:'WithStatement',YieldExpression:'YieldExpression'},f={Sequence:0,Yield:1,Assignment:1,Conditional:2,ArrowFunction:2,LogicalOR:3,LogicalAND:4,BitwiseOR:5,BitwiseXOR:6,BitwiseAND:7,Equality:8,Relational:9,BitwiseSHIFT:10,Additive:11,Multiplicative:12,Unary:13,Postfix:14,Call:15,New:16,TaggedTemplate:17,Member:18,Primary:19},a0={'||':f.LogicalOR,'&&':f.LogicalAND,'|':f.BitwiseOR,'^':f.BitwiseXOR,'&':f.BitwiseAND,'==':f.Equality,'!=':f.Equality,'===':f.Equality,'!==':f.Equality,is:f.Equality,isnt:f.Equality,'<':f.Relational,'>':f.Relational,'<=':f.Relational,'>=':f.Relational,'in':f.Relational,'instanceof':f.Relational,'<<':f.BitwiseSHIFT,'>>':f.BitwiseSHIFT,'>>>':f.BitwiseSHIFT,'+':f.Additive,'-':f.Additive,'*':f.Multiplicative,'%':f.Multiplicative,'/':f.Multiplicative},B=Array.isArray,B||(B=function a(b){return Object.prototype.toString.call(b)==='[object Array]'}),S={indent:{style:'',base:0},renumber:!0,hexadecimal:!0,quotes:'auto',escapeless:!0,compact:!0,parentheses:!1,semicolons:!1},R=P().format,c.version=a('/package.json',d).version,c.generate=a2,c.attachComments=_.attachComments,c.Precedence=G({},f),c.browser=!1,c.FORMAT_MINIFY=S,c.FORMAT_DEFAULTS=R}()}),a.define('/package.json',function(a,b,c,d){a.exports={name:'escodegen',description:'ECMAScript code generator',homepage:'http://github.com/Constellation/escodegen',main:'escodegen.js',bin:{esgenerate:'./bin/esgenerate.js',escodegen:'./bin/escodegen.js'},version:'1.4.1',engines:{node:'>=0.10.0'},maintainers:[{name:'Yusuke Suzuki',email:'utatane.tea@gmail.com',web:'http://github.com/Constellation'}],repository:{type:'git',url:'http://github.com/Constellation/escodegen.git'},dependencies:{estraverse:'^1.5.1',esutils:'^1.1.4',esprima:'^1.2.2'},optionalDependencies:{'source-map':'~0.1.37'},devDependencies:{'esprima-moz':'*',semver:'^3.0.1',bluebird:'^2.2.2','jshint-stylish':'^0.4.0',chai:'^1.9.1','gulp-mocha':'^1.0.0','gulp-eslint':'^0.1.8',gulp:'^3.8.6','bower-registry-client':'^0.2.1','gulp-jshint':'^1.8.0','commonjs-everywhere':'^0.9.7'},licenses:[{type:'BSD',url:'http://github.com/Constellation/escodegen/raw/master/LICENSE.BSD'}],scripts:{test:'gulp travis','unit-test':'gulp test',lint:'gulp lint',release:'node tools/release.js','build-min':'./node_modules/.bin/cjsify -ma path: tools/entry-point.js > escodegen.browser.min.js',build:'./node_modules/.bin/cjsify -a path: tools/entry-point.js > escodegen.browser.js'}}}),a.define('/node_modules/source-map/lib/source-map.js',function(b,c,d,e){c.SourceMapGenerator=a('/node_modules/source-map/lib/source-map/source-map-generator.js',b).SourceMapGenerator,c.SourceMapConsumer=a('/node_modules/source-map/lib/source-map/source-map-consumer.js',b).SourceMapConsumer,c.SourceNode=a('/node_modules/source-map/lib/source-map/source-node.js',b).SourceNode}),a.define('/node_modules/source-map/lib/source-map/source-node.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(d,h,e){function a(a,b,c,d,e){this.children=[],this.sourceContents={},this.line=a==null?null:a,this.column=b==null?null:b,this.source=c==null?null:c,this.name=e==null?null:e,d!=null&&this.add(d)}var f=d('/node_modules/source-map/lib/source-map/source-map-generator.js',e).SourceMapGenerator,b=d('/node_modules/source-map/lib/source-map/util.js',e),c=/(\r?\n)/,g=/\r\n|[\s\S]/g;a.fromStringWithSourceMap=function d(n,m,j){function l(c,d){if(c===null||c.source===undefined)f.add(d);else{var e=j?b.join(j,c.source):c.source;f.add(new a(c.originalLine,c.originalColumn,e,d,c.name))}}var f=new a,e=n.split(c),k=function(){var a=e.shift(),b=e.shift()||'';return a+b},i=1,h=0,g=null;return m.eachMapping(function(a){if(g!==null)if(i<a.generatedLine){var c='';l(g,k()),i++,h=0}else{var b=e[0],c=b.substr(0,a.generatedColumn-h);e[0]=b.substr(a.generatedColumn-h),h=a.generatedColumn,l(g,c),g=a;return}while(i<a.generatedLine)f.add(k()),i++;if(h<a.generatedColumn){var b=e[0];f.add(b.substr(0,a.generatedColumn)),e[0]=b.substr(a.generatedColumn),h=a.generatedColumn}g=a},this),e.length>0&&(g&&l(g,k()),f.add(e.join(''))),m.sources.forEach(function(a){var c=m.sourceContentFor(a);c!=null&&(j!=null&&(a=b.join(j,a)),f.setSourceContent(a,c))}),f},a.prototype.add=function b(c){if(Array.isArray(c))c.forEach(function(a){this.add(a)},this);else if(c instanceof a||typeof c==='string')c&&this.children.push(c);else throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got '+c);return this},a.prototype.prepend=function b(c){if(Array.isArray(c))for(var d=c.length-1;d>=0;d--)this.prepend(c[d]);else if(c instanceof a||typeof c==='string')this.children.unshift(c);else throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got '+c);return this},a.prototype.walk=function b(e){var c;for(var d=0,f=this.children.length;d<f;d++)c=this.children[d],c instanceof a?c.walk(e):c!==''&&e(c,{source:this.source,line:this.line,column:this.column,name:this.name})},a.prototype.join=function a(e){var b,c,d=this.children.length;if(d>0){for(b=[],c=0;c<d-1;c++)b.push(this.children[c]),b.push(e);b.push(this.children[c]),this.children=b}return this},a.prototype.replaceRight=function b(d,e){var c=this.children[this.children.length-1];return c instanceof a?c.replaceRight(d,e):typeof c==='string'?this.children[this.children.length-1]=c.replace(d,e):this.children.push(''.replace(d,e)),this},a.prototype.setSourceContent=function a(c,d){this.sourceContents[b.toSetString(c)]=d},a.prototype.walkSourceContents=function c(g){for(var d=0,e=this.children.length;d<e;d++)this.children[d]instanceof a&&this.children[d].walkSourceContents(g);var f=Object.keys(this.sourceContents);for(var d=0,e=f.length;d<e;d++)g(b.fromSetString(f[d]),this.sourceContents[f[d]])},a.prototype.toString=function a(){var b='';return this.walk(function(a){b+=a}),b},a.prototype.toStringWithSourceMap=function a(l){var b={code:'',line:1,column:0},d=new f(l),e=!1,h=null,i=null,j=null,k=null;return this.walk(function(f,a){b.code+=f,a.source!==null&&a.line!==null&&a.column!==null?((h!==a.source||i!==a.line||j!==a.column||k!==a.name)&&d.addMapping({source:a.source,original:{line:a.line,column:a.column},generated:{line:b.line,column:b.column},name:a.name}),h=a.source,i=a.line,j=a.column,k=a.name,e=!0):e&&(d.addMapping({generated:{line:b.line,column:b.column}}),h=null,e=!1),f.match(g).forEach(function(f,g,i){c.test(f)?(b.line++,b.column=0,g+1===i.length?(h=null,e=!1):e&&d.addMapping({source:a.source,original:{line:a.line,column:a.column},generated:{line:b.line,column:b.column},name:a.name})):b.column+=f.length})}),this.walkSourceContents(function(a,b){d.setSourceContent(a,b)}),{code:b.code,map:d}},h.SourceNode=a})}),a.define('/node_modules/source-map/lib/source-map/util.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(o,a,p){function m(b,a,c){if(a in b)return b[a];else if(arguments.length===3)return c;else throw new Error('"'+a+'" is a required argument.')}function b(b){var a=b.match(f);return a?{scheme:a[1],auth:a[2],host:a[3],port:a[4],path:a[5]}:null}function c(a){var b='';return a.scheme&&(b+=a.scheme+':'),b+='//',a.auth&&(b+=a.auth+'@'),a.host&&(b+=a.host),a.port&&(b+=':'+a.port),a.path&&(b+=a.path),b}function g(i){var a=i,d=b(i);if(d){if(!d.path)return i;a=d.path}var j=a.charAt(0)==='/',e=a.split(/\/+/);for(var h,g=0,f=e.length-1;f>=0;f--)h=e[f],h==='.'?e.splice(f,1):h==='..'?g++:g>0&&(h===''?(e.splice(f+1,g),g=0):(e.splice(f,2),g--));return a=e.join('/'),a===''&&(a=j?'/':'.'),d?(d.path=a,c(d)):a}function h(h,d){h===''&&(h='.'),d===''&&(d='.');var f=b(d),a=b(h);if(a&&(h=a.path||'/'),f&&!f.scheme)return a&&(f.scheme=a.scheme),c(f);if(f||d.match(e))return d;if(a&&!a.host&&!a.path)return a.host=d,c(a);var i=d.charAt(0)==='/'?d:g(h.replace(/\/+$/,'')+'/'+d);return a?(a.path=i,c(a)):i}function j(a,c){a===''&&(a='.'),a=a.replace(/\/$/,'');var d=b(a);return c.charAt(0)=='/'&&d&&d.path=='/'?c.slice(1):c.indexOf(a+'/')===0?c.substr(a.length+1):c}function k(a){return'$'+a}function l(a){return a.substr(1)}function d(c,d){var a=c||'',b=d||'';return(a>b)-(a<b)}function n(b,c,e){var a;return a=d(b.source,c.source),a?a:(a=b.originalLine-c.originalLine,a?a:(a=b.originalColumn-c.originalColumn,a||e?a:(a=d(b.name,c.name),a?a:(a=b.generatedLine-c.generatedLine,a?a:b.generatedColumn-c.generatedColumn))))}function i(b,c,e){var a;return a=b.generatedLine-c.generatedLine,a?a:(a=b.generatedColumn-c.generatedColumn,a||e?a:(a=d(b.source,c.source),a?a:(a=b.originalLine-c.originalLine,a?a:(a=b.originalColumn-c.originalColumn,a?a:d(b.name,c.name)))))}a.getArg=m;var f=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/,e=/^data:.+\,.+$/;a.urlParse=b,a.urlGenerate=c,a.normalize=g,a.join=h,a.relative=j,a.toSetString=k,a.fromSetString=l,a.compareByOriginalPositions=n,a.compareByGeneratedPositions=i})}),a.define('/node_modules/source-map/node_modules/amdefine/amdefine.js',function(b,f,g,d){'use strict';function e(e,i){'use strict';function q(b){var a,c;for(a=0;b[a];a+=1)if(c=b[a],c==='.')b.splice(a,1),a-=1;else if(c==='..')if(a===1&&(b[2]==='..'||b[0]==='..'))break;else a>0&&(b.splice(a-1,2),a-=2)}function j(b,c){var a;return b&&b.charAt(0)==='.'&&c&&(a=c.split('/'),a=a.slice(0,a.length-1),a=a.concat(b.split('/')),q(a),b=a.join('/')),b}function p(a){return function(b){return j(b,a)}}function o(c){function a(a){b[c]=a}return a.fromText=function(a,b){throw new Error('amdefine does not implement load.fromText')},a}function m(c,h,l){var m,f,a,j;if(c)f=b[c]={},a={id:c,uri:d,exports:f},m=g(i,f,a,c);else{if(k)throw new Error('amdefine with no module ID cannot be called more than once per file.');k=!0,f=e.exports,a=e,m=g(i,f,a,e.id)}h&&(h=h.map(function(a){return m(a)})),typeof l==='function'?j=l.apply(a.exports,h):j=l,j!==undefined&&(a.exports=j,c&&(b[c]=a.exports))}function l(b,a,c){Array.isArray(b)?(c=a,a=b,b=undefined):typeof b!=='string'&&(c=b,b=a=undefined),a&&!Array.isArray(a)&&(c=a,a=undefined),a||(a=['require','exports','module']),b?f[b]=[b,a,c]:m(b,a,c)}var f={},b={},k=!1,n=a('path',e),g,h;return g=function(b,d,a,e){function f(f,g){if(typeof f==='string')return h(b,d,a,f,e);f=f.map(function(c){return h(b,d,a,c,e)}),c.nextTick(function(){g.apply(null,f)})}return f.toUrl=function(b){return b.indexOf('.')===0?j(b,n.dirname(a.filename)):b},f},i=i||function a(){return e.require.apply(e,arguments)},h=function(d,e,i,a,c){var k=a.indexOf('!'),n=a,q,l;if(k===-1)if(a=j(a,c),a==='require')return g(d,e,i,c);else if(a==='exports')return e;else if(a==='module')return i;else if(b.hasOwnProperty(a))return b[a];else if(f[a])return m.apply(null,f[a]),b[a];else if(d)return d(n);else throw new Error('No module with ID: '+a);else return q=a.substring(0,k),a=a.substring(k+1,a.length),l=h(d,e,i,q,c),l.normalize?a=l.normalize(a,p(c)):a=j(a,c),b[a]?b[a]:(l.load(a,g(d,e,i,c),o(a),{}),b[a])},l.require=function(a){return b[a]?b[a]:f[a]?(m.apply(null,f[a]),b[a]):void 0},l.amd={},l}b.exports=e}),a.define('/node_modules/source-map/lib/source-map/source-map-generator.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(e,g,f){function b(b){b||(b={}),this._file=a.getArg(b,'file',null),this._sourceRoot=a.getArg(b,'sourceRoot',null),this._sources=new d,this._names=new d,this._mappings=[],this._sourcesContents=null}var c=e('/node_modules/source-map/lib/source-map/base64-vlq.js',f),a=e('/node_modules/source-map/lib/source-map/util.js',f),d=e('/node_modules/source-map/lib/source-map/array-set.js',f).ArraySet;b.prototype._version=3,b.fromSourceMap=function c(d){var e=d.sourceRoot,f=new b({file:d.file,sourceRoot:e});return d.eachMapping(function(b){var c={generated:{line:b.generatedLine,column:b.generatedColumn}};b.source!=null&&(c.source=b.source,e!=null&&(c.source=a.relative(e,c.source)),c.original={line:b.originalLine,column:b.originalColumn},b.name!=null&&(c.name=b.name)),f.addMapping(c)}),d.sources.forEach(function(b){var a=d.sourceContentFor(b);a!=null&&f.setSourceContent(b,a)}),f},b.prototype.addMapping=function b(f){var g=a.getArg(f,'generated'),c=a.getArg(f,'original',null),d=a.getArg(f,'source',null),e=a.getArg(f,'name',null);this._validateMapping(g,c,d,e),d!=null&&!this._sources.has(d)&&this._sources.add(d),e!=null&&!this._names.has(e)&&this._names.add(e),this._mappings.push({generatedLine:g.line,generatedColumn:g.column,originalLine:c!=null&&c.line,originalColumn:c!=null&&c.column,source:d,name:e})},b.prototype.setSourceContent=function b(e,d){var c=e;this._sourceRoot!=null&&(c=a.relative(this._sourceRoot,c)),d!=null?(this._sourcesContents||(this._sourcesContents={}),this._sourcesContents[a.toSetString(c)]=d):(delete this._sourcesContents[a.toSetString(c)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null))},b.prototype.applySourceMap=function b(e,j,g){var f=j;if(j==null){if(e.file==null)throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map\'s "file" property. Both were omitted.');f=e.file}var c=this._sourceRoot;c!=null&&(f=a.relative(c,f));var h=new d,i=new d;this._mappings.forEach(function(b){if(b.source===f&&b.originalLine!=null){var d=e.originalPositionFor({line:b.originalLine,column:b.originalColumn});d.source!=null&&(b.source=d.source,g!=null&&(b.source=a.join(g,b.source)),c!=null&&(b.source=a.relative(c,b.source)),b.originalLine=d.line,b.originalColumn=d.column,d.name!=null&&b.name!=null&&(b.name=d.name))}var j=b.source;j!=null&&!h.has(j)&&h.add(j);var k=b.name;k!=null&&!i.has(k)&&i.add(k)},this),this._sources=h,this._names=i,e.sources.forEach(function(b){var d=e.sourceContentFor(b);d!=null&&(g!=null&&(b=a.join(g,b)),c!=null&&(b=a.relative(c,b)),this.setSourceContent(b,d))},this)},b.prototype._validateMapping=function a(b,c,d,e){if(b&&'line'in b&&'column'in b&&b.line>0&&b.column>=0&&!c&&!d&&!e)return;else if(b&&'line'in b&&'column'in b&&c&&'line'in c&&'column'in c&&b.line>0&&b.column>=0&&c.line>0&&c.column>=0&&d)return;else throw new Error('Invalid mapping: '+JSON.stringify({generated:b,source:d,original:c,name:e}))},b.prototype._serializeMappings=function b(){var h=0,g=1,j=0,k=0,i=0,l=0,e='',d;this._mappings.sort(a.compareByGeneratedPositions);for(var f=0,m=this._mappings.length;f<m;f++){if(d=this._mappings[f],d.generatedLine!==g){h=0;while(d.generatedLine!==g)e+=';',g++}else if(f>0){if(!a.compareByGeneratedPositions(d,this._mappings[f-1]))continue;e+=','}e+=c.encode(d.generatedColumn-h),h=d.generatedColumn,d.source!=null&&(e+=c.encode(this._sources.indexOf(d.source)-l),l=this._sources.indexOf(d.source),e+=c.encode(d.originalLine-1-k),k=d.originalLine-1,e+=c.encode(d.originalColumn-j),j=d.originalColumn,d.name!=null&&(e+=c.encode(this._names.indexOf(d.name)-i),i=this._names.indexOf(d.name)))}return e},b.prototype._generateSourcesContent=function b(d,c){return d.map(function(b){if(!this._sourcesContents)return null;c!=null&&(b=a.relative(c,b));var d=a.toSetString(b);return Object.prototype.hasOwnProperty.call(this._sourcesContents,d)?this._sourcesContents[d]:null},this)},b.prototype.toJSON=function a(){var b={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(b.file=this._file),this._sourceRoot!=null&&(b.sourceRoot=this._sourceRoot),this._sourcesContents&&(b.sourcesContent=this._generateSourcesContent(b.sources,b.sourceRoot)),b},b.prototype.toString=function a(){return JSON.stringify(this)},g.SourceMapGenerator=b})}),a.define('/node_modules/source-map/lib/source-map/array-set.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(c,d,e){function a(){this._array=[],this._set={}}var b=c('/node_modules/source-map/lib/source-map/util.js',e);a.fromArray=function b(e,g){var d=new a;for(var c=0,f=e.length;c<f;c++)d.add(e[c],g);return d},a.prototype.add=function a(c,f){var d=this.has(c),e=this._array.length;(!d||f)&&this._array.push(c),d||(this._set[b.toSetString(c)]=e)},a.prototype.has=function a(c){return Object.prototype.hasOwnProperty.call(this._set,b.toSetString(c))},a.prototype.indexOf=function a(c){if(this.has(c))return this._set[b.toSetString(c)];throw new Error('"'+c+'" is not in the set.')},a.prototype.at=function a(b){if(b>=0&&b<this._array.length)return this._array[b];throw new Error('No element indexed by '+b)},a.prototype.toArray=function a(){return this._array.slice()},d.ArraySet=a})}),a.define('/node_modules/source-map/lib/source-map/base64-vlq.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(j,f,h){function i(a){return a<0?(-a<<1)+1:(a<<1)+0}function g(b){var c=(b&1)===1,a=b>>1;return c?-a:a}var c=j('/node_modules/source-map/lib/source-map/base64.js',h),a=5,d=1<<a,e=d-1,b=d;f.encode=function d(j){var g='',h,f=i(j);do h=f&e,f>>>=a,f>0&&(h|=b),g+=c.encode(h);while(f>0);return g},f.decode=function d(i){var f=0,l=i.length,j=0,k=0,m,h;do{if(f>=l)throw new Error('Expected more digits in base 64 VLQ value.');h=c.decode(i.charAt(f++)),m=!!(h&b),h&=e,j+=h<<k,k+=a}while(m);return{value:g(j),rest:i.slice(f)}}})}),a.define('/node_modules/source-map/lib/source-map/base64.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(d,c,e){var a={},b={};'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function(c,d){a[c]=d,b[d]=c}),c.encode=function a(c){if(c in b)return b[c];throw new TypeError('Must be between 0 and 63: '+c)},c.decode=function b(c){if(c in a)return a[c];throw new TypeError('Not a valid base 64 digit: '+c)}})}),a.define('/node_modules/source-map/lib/source-map/source-map-consumer.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(e,h,f){function b(c){var b=c;typeof c==='string'&&(b=JSON.parse(c.replace(/^\)\]\}'/,'')));var e=a.getArg(b,'version'),f=a.getArg(b,'sources'),g=a.getArg(b,'names',[]),h=a.getArg(b,'sourceRoot',null),i=a.getArg(b,'sourcesContent',null),j=a.getArg(b,'mappings'),k=a.getArg(b,'file',null);if(e!=this._version)throw new Error('Unsupported version: '+e);this._names=d.fromArray(g,!0),this._sources=d.fromArray(f,!0),this.sourceRoot=h,this.sourcesContent=i,this._mappings=j,this.file=k}var a=e('/node_modules/source-map/lib/source-map/util.js',f),g=e('/node_modules/source-map/lib/source-map/binary-search.js',f),d=e('/node_modules/source-map/lib/source-map/array-set.js',f).ArraySet,c=e('/node_modules/source-map/lib/source-map/base64-vlq.js',f);b.fromSourceMap=function c(f){var e=Object.create(b.prototype);return e._names=d.fromArray(f._names.toArray(),!0),e._sources=d.fromArray(f._sources.toArray(),!0),e.sourceRoot=f._sourceRoot,e.sourcesContent=f._generateSourcesContent(e._sources.toArray(),e.sourceRoot),e.file=f._file,e.__generatedMappings=f._mappings.slice().sort(a.compareByGeneratedPositions),e.__originalMappings=f._mappings.slice().sort(a.compareByOriginalPositions),e},b.prototype._version=3,Object.defineProperty(b.prototype,'sources',{get:function(){return this._sources.toArray().map(function(b){return this.sourceRoot!=null?a.join(this.sourceRoot,b):b},this)}}),b.prototype.__generatedMappings=null,Object.defineProperty(b.prototype,'_generatedMappings',{get:function(){return this.__generatedMappings||(this.__generatedMappings=[],this.__originalMappings=[],this._parseMappings(this._mappings,this.sourceRoot)),this.__generatedMappings}}),b.prototype.__originalMappings=null,Object.defineProperty(b.prototype,'_originalMappings',{get:function(){return this.__originalMappings||(this.__generatedMappings=[],this.__originalMappings=[],this._parseMappings(this._mappings,this.sourceRoot)),this.__originalMappings}}),b.prototype._parseMappings=function b(n,o){var j=1,h=0,i=0,m=0,k=0,l=0,g=/^[,;]/,d=n,f,e;while(d.length>0)if(d.charAt(0)===';')j++,d=d.slice(1),h=0;else if(d.charAt(0)===',')d=d.slice(1);else{if(f={},f.generatedLine=j,e=c.decode(d),f.generatedColumn=h+e.value,h=f.generatedColumn,d=e.rest,d.length>0&&!g.test(d.charAt(0))){if(e=c.decode(d),f.source=this._sources.at(k+e.value),k+=e.value,d=e.rest,d.length===0||g.test(d.charAt(0)))throw new Error('Found a source, but no line and column');if(e=c.decode(d),f.originalLine=i+e.value,i=f.originalLine,f.originalLine+=1,d=e.rest,d.length===0||g.test(d.charAt(0)))throw new Error('Found a source and line, but no column');e=c.decode(d),f.originalColumn=m+e.value,m=f.originalColumn,d=e.rest,d.length>0&&!g.test(d.charAt(0))&&(e=c.decode(d),f.name=this._names.at(l+e.value),l+=e.value,d=e.rest)}this.__generatedMappings.push(f),typeof f.originalLine==='number'&&this.__originalMappings.push(f)}this.__generatedMappings.sort(a.compareByGeneratedPositions),this.__originalMappings.sort(a.compareByOriginalPositions)},b.prototype._findMapping=function a(b,e,c,d,f){if(b[c]<=0)throw new TypeError('Line must be greater than or equal to 1, got '+b[c]);if(b[d]<0)throw new TypeError('Column must be greater than or equal to 0, got '+b[d]);return g.search(b,e,f)},b.prototype.originalPositionFor=function b(f){var e={generatedLine:a.getArg(f,'line'),generatedColumn:a.getArg(f,'column')},c=this._findMapping(e,this._generatedMappings,'generatedLine','generatedColumn',a.compareByGeneratedPositions);if(c&&c.generatedLine===e.generatedLine){var d=a.getArg(c,'source',null);return d!=null&&this.sourceRoot!=null&&(d=a.join(this.sourceRoot,d)),{source:d,line:a.getArg(c,'originalLine',null),column:a.getArg(c,'originalColumn',null),name:a.getArg(c,'name',null)}}return{source:null,line:null,column:null,name:null}},b.prototype.sourceContentFor=function b(c){if(!this.sourcesContent)return null;if(this.sourceRoot!=null&&(c=a.relative(this.sourceRoot,c)),this._sources.has(c))return this.sourcesContent[this._sources.indexOf(c)];var d;if(this.sourceRoot!=null&&(d=a.urlParse(this.sourceRoot))){var e=c.replace(/^file:\/\//,'');if(d.scheme=='file'&&this._sources.has(e))return this.sourcesContent[this._sources.indexOf(e)];if((!d.path||d.path=='/')&&this._sources.has('/'+c))return this.sourcesContent[this._sources.indexOf('/'+c)]}throw new Error('"'+c+'" is not in the SourceMap.')},b.prototype.generatedPositionFor=function b(e){var c={source:a.getArg(e,'source'),originalLine:a.getArg(e,'line'),originalColumn:a.getArg(e,'column')};this.sourceRoot!=null&&(c.source=a.relative(this.sourceRoot,c.source));var d=this._findMapping(c,this._originalMappings,'originalLine','originalColumn',a.compareByOriginalPositions);return d?{line:a.getArg(d,'generatedLine',null),column:a.getArg(d,'generatedColumn',null)}:{line:null,column:null}},b.GENERATED_ORDER=1,b.ORIGINAL_ORDER=2,b.prototype.eachMapping=function c(h,i,j){var f=i||null,g=j||b.GENERATED_ORDER,d;switch(g){case b.GENERATED_ORDER:d=this._generatedMappings;break;case b.ORIGINAL_ORDER:d=this._originalMappings;break;default:throw new Error('Unknown order of iteration.')}var e=this.sourceRoot;d.map(function(b){var c=b.source;return c!=null&&e!=null&&(c=a.join(e,c)),{source:c,generatedLine:b.generatedLine,generatedColumn:b.generatedColumn,originalLine:b.originalLine,originalColumn:b.originalColumn,name:b.name}}).forEach(h,f)},h.SourceMapConsumer=b})}),a.define('/node_modules/source-map/lib/source-map/binary-search.js',function(c,d,e,f){if(typeof b!=='function')var b=a('/node_modules/source-map/node_modules/amdefine/amdefine.js',c)(c,a);b(function(c,b,d){function a(c,e,f,d,g){var b=Math.floor((e-c)/2)+c,h=g(f,d[b],!0);return h===0?d[b]:h>0?e-b>1?a(b,e,f,d,g):d[b]:b-c>1?a(c,b,f,d,g):c<0?null:d[c]}b.search=function b(d,c,e){return c.length>0?a(-1,c.length,d,c,e):null}})}),a.define('/node_modules/esutils/lib/utils.js',function(b,c,d,e){!function(){'use strict';c.ast=a('/node_modules/esutils/lib/ast.js',b),c.code=a('/node_modules/esutils/lib/code.js',b),c.keyword=a('/node_modules/esutils/lib/keyword.js',b)}()}),a.define('/node_modules/esutils/lib/keyword.js',function(b,c,d,e){!function(d){'use strict';function i(a){switch(a){case'implements':case'interface':case'package':case'private':case'protected':case'public':case'static':case'let':return!0;default:return!1}}function g(a,b){return!b&&a==='yield'?!1:c(a,b)}function c(a,b){if(b&&i(a))return!0;switch(a.length){case 2:return a==='if'||a==='in'||a==='do';case 3:return a==='var'||a==='for'||a==='new'||a==='try';case 4:return a==='this'||a==='else'||a==='case'||a==='void'||a==='with'||a==='enum';case 5:return a==='while'||a==='break'||a==='catch'||a==='throw'||a==='const'||a==='yield'||a==='class'||a==='super';case 6:return a==='return'||a==='typeof'||a==='delete'||a==='switch'||a==='export'||a==='import';case 7:return a==='default'||a==='finally'||a==='extends';case 8:return a==='function'||a==='continue'||a==='debugger';case 10:return a==='instanceof';default:return!1}}function f(a,b){return a==='null'||a==='true'||a==='false'||g(a,b)}function h(a,b){return a==='null'||a==='true'||a==='false'||c(a,b)}function j(a){return a==='eval'||a==='arguments'}function e(b){var c,e,a;if(b.length===0)return!1;if(a=b.charCodeAt(0),!d.isIdentifierStart(a)||a===92)return!1;for(c=1,e=b.length;c<e;++c)if(a=b.charCodeAt(c),!d.isIdentifierPart(a)||a===92)return!1;return!0}function l(a,b){return e(a)&&!f(a,b)}function k(a,b){return e(a)&&!h(a,b)}d=a('/node_modules/esutils/lib/code.js',b),b.exports={isKeywordES5:g,isKeywordES6:c,isReservedWordES5:f,isReservedWordES6:h,isRestrictedWord:j,isIdentifierName:e,isIdentifierES5:l,isIdentifierES6:k}}()}),a.define('/node_modules/esutils/lib/code.js',function(a,b,c,d){!function(b){'use strict';function c(a){return a>=48&&a<=57}function d(a){return c(a)||97<=a&&a<=102||65<=a&&a<=70}function e(a){return a>=48&&a<=55}function f(a){return a===32||a===9||a===11||a===12||a===160||a>=5760&&[5760,6158,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8239,8287,12288,65279].indexOf(a)>=0}function g(a){return a===10||a===13||a===8232||a===8233}function h(a){return a===36||a===95||a>=65&&a<=90||a>=97&&a<=122||a===92||a>=128&&b.NonAsciiIdentifierStart.test(String.fromCharCode(a))}function i(a){return a===36||a===95||a>=65&&a<=90||a>=97&&a<=122||a>=48&&a<=57||a===92||a>=128&&b.NonAsciiIdentifierPart.test(String.fromCharCode(a))}b={NonAsciiIdentifierStart:new RegExp('[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〇〡-〩〱-〵〸-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]'),NonAsciiIdentifierPart:new RegExp('[ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮ̀-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁ҃-҇Ҋ-ԧԱ-Ֆՙա-և֑-ׇֽֿׁׂׅׄא-תװ-ײؐ-ؚؠ-٩ٮ-ۓە-ۜ۟-۪ۨ-ۼۿܐ-݊ݍ-ޱ߀-ߵߺࠀ-࠭ࡀ-࡛ࢠࢢ-ࢬࣤ-ࣾऀ-ॣ०-९ॱ-ॷॹ-ॿঁ-ঃঅ-ঌএঐও-নপ-রলশ-হ়-ৄেৈো-ৎৗড়ঢ়য়-ৣ০-ৱਁ-ਃਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹ਼ਾ-ੂੇੈੋ-੍ੑਖ਼-ੜਫ਼੦-ੵઁ-ઃઅ-ઍએ-ઑઓ-નપ-રલળવ-હ઼-ૅે-ૉો-્ૐૠ-ૣ૦-૯ଁ-ଃଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହ଼-ୄେୈୋ-୍ୖୗଡ଼ଢ଼ୟ-ୣ୦-୯ୱஂஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹா-ூெ-ைொ-்ௐௗ௦-௯ఁ-ఃఅ-ఌఎ-ఐఒ-నప-ళవ-హఽ-ౄె-ైొ-్ౕౖౘౙౠ-ౣ౦-౯ಂಃಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹ಼-ೄೆ-ೈೊ-್ೕೖೞೠ-ೣ೦-೯ೱೲംഃഅ-ഌഎ-ഐഒ-ഺഽ-ൄെ-ൈൊ-ൎൗൠ-ൣ൦-൯ൺ-ൿංඃඅ-ඖක-නඳ-රලව-ෆ්ා-ුූෘ-ෟෲෳก-ฺเ-๎๐-๙ກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ູົ-ຽເ-ໄໆ່-ໍ໐-໙ໜ-ໟༀ༘༙༠-༩༹༵༷༾-ཇཉ-ཬཱ-྄྆-ྗྙ-ྼ࿆က-၉ၐ-ႝႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚ፝-፟ᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-᜔ᜠ-᜴ᝀ-ᝓᝠ-ᝬᝮ-ᝰᝲᝳក-៓ៗៜ៝០-៩᠋-᠍᠐-᠙ᠠ-ᡷᢀ-ᢪᢰ-ᣵᤀ-ᤜᤠ-ᤫᤰ-᤻᥆-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉ᧐-᧙ᨀ-ᨛᨠ-ᩞ᩠-᩿᩼-᪉᪐-᪙ᪧᬀ-ᭋ᭐-᭙᭫-᭳ᮀ-᯳ᰀ-᰷᱀-᱉ᱍ-ᱽ᳐-᳔᳒-ᳶᴀ-ᷦ᷼-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼ‌‍‿⁀⁔ⁱⁿₐ-ₜ⃐-⃥⃜⃡-⃰ℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯ⵿-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⷠ-ⷿⸯ々-〇〡-〯〱-〵〸-〼ぁ-ゖ゙゚ゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘫꙀ-꙯ꙴ-꙽ꙿ-ꚗꚟ-꛱ꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠧꡀ-ꡳꢀ-꣄꣐-꣙꣠-ꣷꣻ꤀-꤭ꤰ-꥓ꥠ-ꥼꦀ-꧀ꧏ-꧙ꨀ-ꨶꩀ-ꩍ꩐-꩙ꩠ-ꩶꩺꩻꪀ-ꫂꫛ-ꫝꫠ-ꫯꫲ-꫶ꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯪ꯬꯭꯰-꯹가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻ︀-️︠-︦︳︴﹍-﹏ﹰ-ﹴﹶ-ﻼ０-９Ａ-Ｚ＿ａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]')},a.exports={isDecimalDigit:c,isHexDigit:d,isOctalDigit:e,isWhiteSpace:f,isLineTerminator:g,isIdentifierStart:h,isIdentifierPart:i}}()}),a.define('/node_modules/esutils/lib/ast.js',function(a,b,c,d){!function(){'use strict';function d(a){if(a==null)return!1;switch(a.type){case'ArrayExpression':case'AssignmentExpression':case'BinaryExpression':case'CallExpression':case'ConditionalExpression':case'FunctionExpression':case'Identifier':case'Literal':case'LogicalExpression':case'MemberExpression':case'NewExpression':case'ObjectExpression':case'SequenceExpression':case'ThisExpression':case'UnaryExpression':case'UpdateExpression':return!0}return!1}function e(a){if(a==null)return!1;switch(a.type){case'DoWhileStatement':case'ForInStatement':case'ForStatement':case'WhileStatement':return!0}return!1}function b(a){if(a==null)return!1;switch(a.type){case'BlockStatement':case'BreakStatement':case'ContinueStatement':case'DebuggerStatement':case'DoWhileStatement':case'EmptyStatement':case'ExpressionStatement':case'ForInStatement':case'ForStatement':case'IfStatement':case'LabeledStatement':case'ReturnStatement':case'SwitchStatement':case'ThrowStatement':case'TryStatement':case'VariableDeclaration':case'WhileStatement':case'WithStatement':return!0}return!1}function f(a){return b(a)||a!=null&&a.type==='FunctionDeclaration'}function c(a){switch(a.type){case'IfStatement':return a.alternate!=null?a.alternate:a.consequent;case'LabeledStatement':case'ForStatement':case'ForInStatement':case'WhileStatement':case'WithStatement':return a.body}return null}function g(b){var a;if(b.type!=='IfStatement')return!1;if(b.alternate==null)return!1;a=b.consequent;do{if(a.type==='IfStatement'&&a.alternate==null)return!0;a=c(a)}while(a);return!1}a.exports={isExpression:d,isStatement:b,isIterationStatement:e,isSourceElement:f,isProblematicIfStatement:g,trailingStatement:c}}()}),a.define('/node_modules/estraverse/estraverse.js',function(b,a,c,d){!function(c,b){'use strict';typeof define==='function'&&define.amd?define(['exports'],b):a!==void 0?b(a):b(c.estraverse={})}(this,function(e){'use strict';function m(){}function l(d){var c={},a,b;for(a in d)d.hasOwnProperty(a)&&(b=d[a],typeof b==='object'&&b!==null?c[a]=l(b):c[a]=b);return c}function s(b){var c={},a;for(a in b)b.hasOwnProperty(a)&&(c[a]=b[a]);return c}function r(e,f){var b,a,c,d;a=e.length,c=0;while(a)b=a>>>1,d=c+b,f(e[d])?a=b:(c=d+1,a-=b+1);return c}function q(e,f){var b,a,c,d;a=e.length,c=0;while(a)b=a>>>1,d=c+b,f(e[d])?(c=d+1,a-=b+1):a=b;return c}function h(a,b){this.parent=a,this.key=b}function d(a,b,c,d){this.node=a,this.path=b,this.wrap=c,this.ref=d}function b(){}function k(c,d){var a=new b;return a.traverse(c,d)}function p(c,d){var a=new b;return a.replace(c,d)}function n(a,c){var b;return b=r(c,function b(c){return c.range[0]>a.range[0]}),a.extendedRange=[a.range[0],a.range[1]],b!==c.length&&(a.extendedRange[1]=c[b].range[0]),b-=1,b>=0&&(a.extendedRange[0]=c[b].range[1]),a}function o(d,e,i){var a=[],h,g,c,b;if(!d.range)throw new Error('attachComments needs range information');if(!i.length){if(e.length){for(c=0,g=e.length;c<g;c+=1)h=l(e[c]),h.extendedRange=[0,d.range[0]],a.push(h);d.leadingComments=a}return d}for(c=0,g=e.length;c<g;c+=1)a.push(n(l(e[c]),i));return b=0,k(d,{enter:function(c){var d;while(b<a.length){if(d=a[b],d.extendedRange[1]>c.range[0])break;d.extendedRange[1]===c.range[0]?(c.leadingComments||(c.leadingComments=[]),c.leadingComments.push(d),a.splice(b,1)):b+=1}return b===a.length?f.Break:a[b].extendedRange[0]>c.range[1]?f.Skip:void 0}}),b=0,k(d,{leave:function(c){var d;while(b<a.length){if(d=a[b],c.range[1]<d.extendedRange[0])break;c.range[1]===d.extendedRange[0]?(c.trailingComments||(c.trailingComments=[]),c.trailingComments.push(d),a.splice(b,1)):b+=1}return b===a.length?f.Break:a[b].extendedRange[0]>c.range[1]?f.Skip:void 0}}),d}var i,g,f,j,a,c;i={AssignmentExpression:'AssignmentExpression',ArrayExpression:'ArrayExpression',ArrayPattern:'ArrayPattern',ArrowFunctionExpression:'ArrowFunctionExpression',BlockStatement:'BlockStatement',BinaryExpression:'BinaryExpression',BreakStatement:'BreakStatement',CallExpression:'CallExpression',CatchClause:'CatchClause',ClassBody:'ClassBody',ClassDeclaration:'ClassDeclaration',ClassExpression:'ClassExpression',ConditionalExpression:'ConditionalExpression',ContinueStatement:'ContinueStatement',DebuggerStatement:'DebuggerStatement',DirectiveStatement:'DirectiveStatement',DoWhileStatement:'DoWhileStatement',EmptyStatement:'EmptyStatement',ExpressionStatement:'ExpressionStatement',ForStatement:'ForStatement',ForInStatement:'ForInStatement',FunctionDeclaration:'FunctionDeclaration',FunctionExpression:'FunctionExpression',Identifier:'Identifier',IfStatement:'IfStatement',Literal:'Literal',LabeledStatement:'LabeledStatement',LogicalExpression:'LogicalExpression',MemberExpression:'MemberExpression',MethodDefinition:'MethodDefinition',NewExpression:'NewExpression',ObjectExpression:'ObjectExpression',ObjectPattern:'ObjectPattern',Program:'Program',Property:'Property',ReturnStatement:'ReturnStatement',SequenceExpression:'SequenceExpression',SwitchStatement:'SwitchStatement',SwitchCase:'SwitchCase',ThisExpression:'ThisExpression',ThrowStatement:'ThrowStatement',TryStatement:'TryStatement',UnaryExpression:'UnaryExpression',UpdateExpression:'UpdateExpression',VariableDeclaration:'VariableDeclaration',VariableDeclarator:'VariableDeclarator',WhileStatement:'WhileStatement',WithStatement:'WithStatement',YieldExpression:'YieldExpression'},g=Array.isArray,g||(g=function a(b){return Object.prototype.toString.call(b)==='[object Array]'}),m(s),m(q),j={AssignmentExpression:['left','right'],ArrayExpression:['elements'],ArrayPattern:['elements'],ArrowFunctionExpression:['params','defaults','rest','body'],BlockStatement:['body'],BinaryExpression:['left','right'],BreakStatement:['label'],CallExpression:['callee','arguments'],CatchClause:['param','body'],ClassBody:['body'],ClassDeclaration:['id','body','superClass'],ClassExpression:['id','body','superClass'],ConditionalExpression:['test','consequent','alternate'],ContinueStatement:['label'],DebuggerStatement:[],DirectiveStatement:[],DoWhileStatement:['body','test'],EmptyStatement:[],ExpressionStatement:['expression'],ForStatement:['init','test','update','body'],ForInStatement:['left','right','body'],ForOfStatement:['left','right','body'],FunctionDeclaration:['id','params','defaults','rest','body'],FunctionExpression:['id','params','defaults','rest','body'],Identifier:[],IfStatement:['test','consequent','alternate'],Literal:[],LabeledStatement:['label','body'],LogicalExpression:['left','right'],MemberExpression:['object','property'],MethodDefinition:['key','value'],NewExpression:['callee','arguments'],ObjectExpression:['properties'],ObjectPattern:['properties'],Program:['body'],Property:['key','value'],ReturnStatement:['argument'],SequenceExpression:['expressions'],SwitchStatement:['discriminant','cases'],SwitchCase:['test','consequent'],ThisExpression:[],ThrowStatement:['argument'],TryStatement:['block','handlers','handler','guardedHandlers','finalizer'],UnaryExpression:['argument'],UpdateExpression:['argument'],VariableDeclaration:['declarations'],VariableDeclarator:['id','init'],WhileStatement:['test','body'],WithStatement:['object','body'],YieldExpression:['argument']},a={},c={},f={Break:a,Skip:c},h.prototype.replace=function a(b){this.parent[this.key]=b},b.prototype.path=function a(){function e(b,a){if(g(a))for(c=0,h=a.length;c<h;++c)b.push(a[c]);else b.push(a)}var b,f,c,h,d,i;if(!this.__current.path)return null;for(d=[],b=2,f=this.__leavelist.length;b<f;++b)i=this.__leavelist[b],e(d,i.path);return e(d,this.__current.path),d},b.prototype.parents=function a(){var b,d,c;for(c=[],b=1,d=this.__leavelist.length;b<d;++b)c.push(this.__leavelist[b].node);return c},b.prototype.current=function a(){return this.__current.node},b.prototype.__execute=function a(c,d){var e,b;return b=undefined,e=this.__current,this.__current=d,this.__state=null,c&&(b=c.call(this,d.node,this.__leavelist[this.__leavelist.length-1].node)),this.__current=e,b},b.prototype.notify=function a(b){this.__state=b},b.prototype.skip=function(){this.notify(c)},b.prototype['break']=function(){this.notify(a)},b.prototype.__initialize=function(a,b){this.visitor=b,this.root=a,this.__worklist=[],this.__leavelist=[],this.__current=null,this.__state=null},b.prototype.traverse=function b(u,r){var h,o,e,t,n,l,m,p,k,q,f,s;this.__initialize(u,r),s={},h=this.__worklist,o=this.__leavelist,h.push(new d(u,null,null,null)),o.push(new d(null,null,null,null));while(h.length){if(e=h.pop(),e===s){if(e=o.pop(),l=this.__execute(r.leave,e),this.__state===a||l===a)return;continue}if(e.node){if(l=this.__execute(r.enter,e),this.__state===a||l===a)return;if(h.push(s),o.push(e),this.__state===c||l===c)continue;t=e.node,n=e.wrap||t.type,q=j[n],p=q.length;while((p-=1)>=0){if(m=q[p],f=t[m],!f)continue;if(!g(f)){h.push(new d(f,m,null,null));continue}k=f.length;while((k-=1)>=0){if(!f[k])continue;(n===i.ObjectExpression||n===i.ObjectPattern)&&'properties'===q[p]?e=new d(f[k],[m,k],'Property',null):e=new d(f[k],[m,k],null,null),h.push(e)}}}}},b.prototype.replace=function b(u,v){var m,r,o,t,f,e,q,l,s,k,w,p,n;this.__initialize(u,v),w={},m=this.__worklist,r=this.__leavelist,p={root:u},e=new d(u,null,null,new h(p,'root')),m.push(e),r.push(e);while(m.length){if(e=m.pop(),e===w){if(e=r.pop(),f=this.__execute(v.leave,e),f!==undefined&&f!==a&&f!==c&&e.ref.replace(f),this.__state===a||f===a)return p.root;continue}if(f=this.__execute(v.enter,e),f!==undefined&&f!==a&&f!==c&&(e.ref.replace(f),e.node=f),this.__state===a||f===a)return p.root;if(o=e.node,!o)continue;if(m.push(w),r.push(e),this.__state===c||f===c)continue;t=e.wrap||o.type,s=j[t],q=s.length;while((q-=1)>=0){if(n=s[q],k=o[n],!k)continue;if(!g(k)){m.push(new d(k,n,null,new h(o,n)));continue}l=k.length;while((l-=1)>=0){if(!k[l])continue;t===i.ObjectExpression&&'properties'===s[q]?e=new d(k[l],[n,l],'Property',new h(k,l)):e=new d(k[l],[n,l],null,new h(k,l)),m.push(e)}}}return p.root},e.version='1.5.1-dev',e.Syntax=i,e.traverse=k,e.replace=p,e.attachComments=o,e.VisitorKeys=j,e.VisitorOption=f,e.Controller=b})}),a('/tools/entry-point.js')}.call(this,this))
// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke and various contributors and
// released under an MIT license. The Unicode regexps (for identifiers
// and whitespace) were taken from [Esprima](http://esprima.org) by
// Ariya Hidayat.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/marijnh/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/marijnh/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

(function(root, mod) {
  if (typeof exports == "object" && typeof module == "object") return mod(exports); // CommonJS
  if (typeof define == "function" && define.amd) return define(["exports"], mod); // AMD
  mod(root.acorn || (root.acorn = {})); // Plain browser env
})(this, function(exports) {
  "use strict";

  exports.version = "0.9.0";

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api], with the caveat that inline XML is not recognized.
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  var options, input, inputLen, sourceFile;

  exports.parse = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();
    initParserState();
    return parseTopLevel(options.program);
  };

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = exports.defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, or 5, or 6. This influences support for strict
    // mode, the set of reserved words, support for getters and
    // setters and other features.
    ecmaVersion: 5,
    // Turn on `strictSemicolons` to prevent the parser from doing
    // automatic semicolon insertion.
    strictSemicolons: false,
    // When `allowTrailingCommas` is false, the parser will not allow
    // trailing commas in array and object literals.
    allowTrailingCommas: true,
    // By default, reserved words are not enforced. Enable
    // `forbidReserved` to enforce them. When this option has the
    // value "everywhere", reserved words and keywords can also not be
    // used as property names.
    forbidReserved: false,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokenize() returns. Note that you are not
    // allowed to call the parser from the callback—that will
    // corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null
  };

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  exports.parseExpressionAt = function(inpt, pos, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState(pos);
    initParserState();
    return parseExpression();
  };

  var isArray = function (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

  function setOptions(opts) {
    options = opts || {};
    for (var opt in defaultOptions) if (!has(options, opt))
      options[opt] = defaultOptions[opt];
    sourceFile = options.sourceFile || null;
    if (isArray(options.onToken)) {
      var tokens = options.onToken;
      options.onToken = function (token) {
        tokens.push(token);
      };
    }
    if (isArray(options.onComment)) {
      var comments = options.onComment;
      options.onComment = function (block, text, start, end, startLoc, endLoc) {
        var comment = {
          type: block ? 'Block' : 'Line',
          value: text,
          start: start,
          end: end
        };
        if (options.locations) {
          comment.loc = new SourceLocation();
          comment.loc.start = startLoc;
          comment.loc.end = endLoc;
        }
        if (options.ranges)
          comment.range = [start, end];
        comments.push(comment);
      };
    }
    isKeyword = options.ecmaVersion >= 6 ? isEcma6Keyword : isEcma5AndLessKeyword;
  }

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  var getLineInfo = exports.getLineInfo = function(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreak.lastIndex = cur;
      var match = lineBreak.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else break;
    }
    return {line: line, column: offset - cur};
  };

  function Token() {
    this.type = tokType;
    this.value = tokVal;
    this.start = tokStart;
    this.end = tokEnd;
    if (options.locations) {
      this.loc = new SourceLocation();
      this.loc.end = tokEndLoc;
      // TODO: remove in next major release
      this.startLoc = tokStartLoc;
      this.endLoc = tokEndLoc;
    }
    if (options.ranges)
      this.range = [tokStart, tokEnd];
  }

  exports.Token = Token;

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenize` export provides an interface to the tokenizer.
  // Because the tokenizer is optimized for being efficiently used by
  // the Acorn parser itself, this interface is somewhat crude and not
  // very modular. Performing another parse or call to `tokenize` will
  // reset the internal state, and invalidate existing tokenizers.

  exports.tokenize = function(inpt, opts) {
    input = String(inpt); inputLen = input.length;
    setOptions(opts);
    initTokenState();

    function getToken(forceRegexp) {
      lastEnd = tokEnd;
      readToken(forceRegexp);
      return new Token();
    }
    getToken.jumpTo = function(pos, reAllowed) {
      tokPos = pos;
      if (options.locations) {
        tokCurLine = 1;
        tokLineStart = lineBreak.lastIndex = 0;
        var match;
        while ((match = lineBreak.exec(input)) && match.index < pos) {
          ++tokCurLine;
          tokLineStart = match.index + match[0].length;
        }
      }
      tokRegexpAllowed = reAllowed;
      skipSpace();
    };
    return getToken;
  };

  // State is kept in (closure-)global variables. We already saw the
  // `options`, `input`, and `inputLen` variables above.

  // The current position of the tokenizer in the input.

  var tokPos;

  // The start and end offsets of the current token.

  var tokStart, tokEnd;

  // When `options.locations` is true, these hold objects
  // containing the tokens start and end line/column pairs.

  var tokStartLoc, tokEndLoc;

  // The type and value of the current token. Token types are objects,
  // named by variables against which they can be compared, and
  // holding properties that describe them (indicating, for example,
  // the precedence of an infix operator, and the original name of a
  // keyword token). The kind of value that's held in `tokVal` depends
  // on the type of the token. For literals, it is the literal value,
  // for operators, the operator name, and so on.

  var tokType, tokVal;

  // Internal state for the tokenizer. To distinguish between division
  // operators and regular expressions, it remembers whether the last
  // token was one that is allowed to be followed by an expression.
  // (If it is, a slash is probably a regexp, if it isn't it's a
  // division operator. See the `parseStatement` function for a
  // caveat.)

  var tokRegexpAllowed;

  // When `options.locations` is true, these are used to keep
  // track of the current line, and know when a new line has been
  // entered.

  var tokCurLine, tokLineStart;

  // These store the position of the previous token, which is useful
  // when finishing a node and assigning its `end` position.

  var lastStart, lastEnd, lastEndLoc;

  // This is the parser's state. `inFunction` is used to reject
  // `return` statements outside of functions, `inGenerator` to
  // reject `yield`s outside of generators, `labels` to verify
  // that `break` and `continue` have somewhere to jump to, and
  // `strict` indicates whether strict mode is on.

  var inFunction, inGenerator, labels, strict;

  // This counter is used for checking that arrow expressions did
  // not contain nested parentheses in argument list.

  var metParenL;

  // This is used by parser for detecting if it's inside ES6
  // Template String. If it is, it should treat '$' as prefix before
  // '{expression}' and everything else as string literals.

  var inTemplate;

  function initParserState() {
    lastStart = lastEnd = tokPos;
    if (options.locations) lastEndLoc = new Position;
    inFunction = inGenerator = strict = false;
    labels = [];
    readToken();
  }

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  function raise(pos, message) {
    var loc = getLineInfo(input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = tokPos;
    throw err;
  }

  // Reused empty array added for node fields that are always empty.

  var empty = [];

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // These are the general types. The `type` property is only used to
  // make them recognizeable when debugging.

  var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
  var _name = {type: "name"}, _eof = {type: "eof"};

  // Keyword tokens. The `keyword` property (also used in keyword-like
  // operators) indicates that the token originated from an
  // identifier-like word, which is used when parsing property names.
  //
  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
  var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
  var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
  var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
  var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
  var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
  var _let = {keyword: "let"}, _const = {keyword: "const"};
  var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
  var _this = {keyword: "this"};
  var _class = {keyword: "class"}, _extends = {keyword: "extends", beforeExpr: true};
  var _export = {keyword: "export"}, _import = {keyword: "import"};
  var _yield = {keyword: "yield", beforeExpr: true};

  // The keywords that denote values.

  var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
  var _false = {keyword: "false", atomValue: false};

  // Some keywords are treated as regular operators. `in` sometimes
  // (when parsing `for`) needs to be tested against specifically, so
  // we assign a variable name to it for quick comparing.

  var _in = {keyword: "in", binop: 7, beforeExpr: true};

  // Map keyword names to token types.

  var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
                      "continue": _continue, "debugger": _debugger, "default": _default,
                      "do": _do, "else": _else, "finally": _finally, "for": _for,
                      "function": _function, "if": _if, "return": _return, "switch": _switch,
                      "throw": _throw, "try": _try, "var": _var, "let": _let, "const": _const,
                      "while": _while, "with": _with,
                      "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
                      "instanceof": {keyword: "instanceof", binop: 7, beforeExpr: true}, "this": _this,
                      "typeof": {keyword: "typeof", prefix: true, beforeExpr: true},
                      "void": {keyword: "void", prefix: true, beforeExpr: true},
                      "delete": {keyword: "delete", prefix: true, beforeExpr: true},
                      "class": _class, "extends": _extends,
                      "export": _export, "import": _import, "yield": _yield};

  // Punctuation token types. Again, the `type` property is purely for debugging.

  var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
  var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
  var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
  var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _ellipsis = {type: "..."}, _question = {type: "?", beforeExpr: true};
  var _arrow = {type: "=>", beforeExpr: true}, _bquote = {type: "`"}, _dollarBraceL = {type: "${", beforeExpr: true};

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator. `isUpdate` specifies that the node produced by
  // the operator should be of type UpdateExpression rather than
  // simply UnaryExpression (`++` and `--`).
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
  var _assign = {isAssign: true, beforeExpr: true};
  var _incDec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
  var _logicalOR = {binop: 1, beforeExpr: true};
  var _logicalAND = {binop: 2, beforeExpr: true};
  var _bitwiseOR = {binop: 3, beforeExpr: true};
  var _bitwiseXOR = {binop: 4, beforeExpr: true};
  var _bitwiseAND = {binop: 5, beforeExpr: true};
  var _equality = {binop: 6, beforeExpr: true};
  var _relational = {binop: 7, beforeExpr: true};
  var _bitShift = {binop: 8, beforeExpr: true};
  var _plusMin = {binop: 9, prefix: true, beforeExpr: true};
  var _modulo = {binop: 10, beforeExpr: true};

  // '*' may be multiply or have special meaning in ES6
  var _star = {binop: 10, beforeExpr: true};

  // Provide access to the token types for external users of the
  // tokenizer.

  exports.tokTypes = {bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
                      parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
                      dot: _dot, ellipsis: _ellipsis, question: _question, slash: _slash, eq: _eq,
                      name: _name, eof: _eof, num: _num, regexp: _regexp, string: _string,
                      arrow: _arrow, bquote: _bquote, dollarBraceL: _dollarBraceL};
  for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];

  // This is a trick taken from Esprima. It turns out that, on
  // non-Chrome browsers, to check whether a string is in a set, a
  // predicate containing a big ugly `switch` statement is faster than
  // a regular expression, and on Chrome the two are about on par.
  // This function uses `eval` (non-lexical) to produce such a
  // predicate from a space-separated string of words.
  //
  // It starts by sorting the words by length.

  function makePredicate(words) {
    words = words.split(" ");
    var f = "", cats = [];
    out: for (var i = 0; i < words.length; ++i) {
      for (var j = 0; j < cats.length; ++j)
        if (cats[j][0].length == words[i].length) {
          cats[j].push(words[i]);
          continue out;
        }
      cats.push([words[i]]);
    }
    function compareTo(arr) {
      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
      f += "switch(str){";
      for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
      f += "return true}return false;";
    }

    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.

    if (cats.length > 3) {
      cats.sort(function(a, b) {return b.length - a.length;});
      f += "switch(str.length){";
      for (var i = 0; i < cats.length; ++i) {
        var cat = cats[i];
        f += "case " + cat[0].length + ":";
        compareTo(cat);
      }
      f += "}";

    // Otherwise, simply generate a flat `switch` statement.

    } else {
      compareTo(words);
    }
    return new Function("str", f);
  }

  // The ECMAScript 3 reserved word list.

  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

  // ECMAScript 5 reserved words.

  var isReservedWord5 = makePredicate("class enum extends super const export import");

  // The additional reserved words in strict mode.

  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

  // The forbidden variable names in strict mode.

  var isStrictBadIdWord = makePredicate("eval arguments");

  // And the keywords.

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var isEcma5AndLessKeyword = makePredicate(ecma5AndLessKeywords);

  var isEcma6Keyword = makePredicate(ecma5AndLessKeywords + " let const class extends export import yield");

  var isKeyword = isEcma5AndLessKeyword;

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `tools/generate-identifier-regex.js`.

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
  var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
  var nonASCIIidentifierChars = "\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19B0-\u19C0\u19C8\u19C9\u19D0-\u19D9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F1\uA900-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F";
  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // Whether a single character denotes a newline.

  var newline = /[\n\r\u2028\u2029]/;

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  // Test whether a given character code starts an identifier.

  var isIdentifierStart = exports.isIdentifierStart = function(code) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  };

  // Test whether a given character is part of an identifier.

  var isIdentifierChar = exports.isIdentifierChar = function(code) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123)return true;
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  };

  // ## Tokenizer

  // These are used when `options.locations` is on, for the
  // `tokStartLoc` and `tokEndLoc` properties.

  function Position() {
    this.line = tokCurLine;
    this.column = tokPos - tokLineStart;
  }

  // Reset the token state. Used at the start of a parse.

  function initTokenState(pos) {
    if (pos) {
      tokPos = pos;
      tokLineStart = Math.max(0, input.lastIndexOf("\n", pos));
      tokCurLine = input.slice(0, tokLineStart).split(newline).length;
    } else {
      tokCurLine = 1;
      tokPos = tokLineStart = 0;
    }
    tokRegexpAllowed = true;
    metParenL = 0;
    inTemplate = false;
    skipSpace();
  }

  // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
  // `tokRegexpAllowed`, and skips the space after the token, so that
  // the next one's `tokStart` will point at the right position.

  function finishToken(type, val, shouldSkipSpace) {
    tokEnd = tokPos;
    if (options.locations) tokEndLoc = new Position;
    tokType = type;
    if (shouldSkipSpace !== false) skipSpace();
    tokVal = val;
    tokRegexpAllowed = type.beforeExpr;
    if (options.onToken) {
      options.onToken(new Token());
    }
  }

  function skipBlockComment() {
    var startLoc = options.onComment && options.locations && new Position;
    var start = tokPos, end = input.indexOf("*/", tokPos += 2);
    if (end === -1) raise(tokPos - 2, "Unterminated comment");
    tokPos = end + 2;
    if (options.locations) {
      lineBreak.lastIndex = start;
      var match;
      while ((match = lineBreak.exec(input)) && match.index < tokPos) {
        ++tokCurLine;
        tokLineStart = match.index + match[0].length;
      }
    }
    if (options.onComment)
      options.onComment(true, input.slice(start + 2, end), start, tokPos,
                        startLoc, options.locations && new Position);
  }

  function skipLineComment(startSkip) {
    var start = tokPos;
    var startLoc = options.onComment && options.locations && new Position;
    var ch = input.charCodeAt(tokPos+=startSkip);
    while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++tokPos;
      ch = input.charCodeAt(tokPos);
    }
    if (options.onComment)
      options.onComment(false, input.slice(start + startSkip, tokPos), start, tokPos,
                        startLoc, options.locations && new Position);
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  function skipSpace() {
    while (tokPos < inputLen) {
      var ch = input.charCodeAt(tokPos);
      if (ch === 32) { // ' '
        ++tokPos;
      } else if (ch === 13) {
        ++tokPos;
        var next = input.charCodeAt(tokPos);
        if (next === 10) {
          ++tokPos;
        }
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch === 10 || ch === 8232 || ch === 8233) {
        ++tokPos;
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch > 8 && ch < 14) {
        ++tokPos;
      } else if (ch === 47) { // '/'
        var next = input.charCodeAt(tokPos + 1);
        if (next === 42) { // '*'
          skipBlockComment();
        } else if (next === 47) { // '/'
          skipLineComment(2);
        } else break;
      } else if (ch === 160) { // '\xa0'
        ++tokPos;
      } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++tokPos;
      } else {
        break;
      }
    }
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  // The `forceRegexp` parameter is used in the one case where the
  // `tokRegexpAllowed` trick does not work. See `parseStatement`.

  function readToken_dot() {
    var next = input.charCodeAt(tokPos + 1);
    if (next >= 48 && next <= 57) return readNumber(true);
    var next2 = input.charCodeAt(tokPos + 2);
    if (options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      tokPos += 3;
      return finishToken(_ellipsis);
    } else {
      ++tokPos;
      return finishToken(_dot);
    }
  }

  function readToken_slash() { // '/'
    var next = input.charCodeAt(tokPos + 1);
    if (tokRegexpAllowed) {++tokPos; return readRegexp();}
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_slash, 1);
  }

  function readToken_mult_modulo(code) { // '%*'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(code === 42 ? _star : _modulo, 1);
  }

  function readToken_pipe_amp(code) { // '|&'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
  }

  function readToken_caret() { // '^'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_bitwiseXOR, 1);
  }

  function readToken_plus_min(code) { // '+-'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) {
      if (next == 45 && input.charCodeAt(tokPos + 2) == 62 &&
          newline.test(input.slice(lastEnd, tokPos))) {
        // A `-->` line comment
        skipLineComment(3);
        skipSpace();
        return readToken();
      }
      return finishOp(_incDec, 2);
    }
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_plusMin, 1);
  }

  function readToken_lt_gt(code) { // '<>'
    var next = input.charCodeAt(tokPos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
      if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
      return finishOp(_bitShift, size);
    }
    if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 &&
        input.charCodeAt(tokPos + 3) == 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      skipLineComment(4);
      skipSpace();
      return readToken();
    }
    if (next === 61)
      size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
    return finishOp(_relational, size);
  }

  function readToken_eq_excl(code) { // '=!', '=>'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
    if (code === 61 && next === 62 && options.ecmaVersion >= 6) { // '=>'
      tokPos += 2;
      return finishToken(_arrow);
    }
    return finishOp(code === 61 ? _eq : _prefix, 1);
  }

  // Get token inside ES6 template (special rules work there).

  function getTemplateToken(code) {
    // '`' and '${' have special meanings, but they should follow
    // string (can be empty)
    if (tokType === _string) {
      if (code === 96) { // '`'
        ++tokPos;
        return finishToken(_bquote);
      } else
      if (code === 36 && input.charCodeAt(tokPos + 1) === 123) { // '${'
        tokPos += 2;
        return finishToken(_dollarBraceL);
      }
    }

    if (code === 125) { // '}'
      ++tokPos;
      return finishToken(_braceR, undefined, false);
    }

    // anything else is considered string literal
    return readTmplString();
  }

  function getTokenFromCode(code) {
    switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46: // '.'
      return readToken_dot();

    // Punctuation tokens.
    case 40: ++tokPos; return finishToken(_parenL);
    case 41: ++tokPos; return finishToken(_parenR);
    case 59: ++tokPos; return finishToken(_semi);
    case 44: ++tokPos; return finishToken(_comma);
    case 91: ++tokPos; return finishToken(_bracketL);
    case 93: ++tokPos; return finishToken(_bracketR);
    case 123: ++tokPos; return finishToken(_braceL);
    case 125: ++tokPos; return finishToken(_braceR);
    case 58: ++tokPos; return finishToken(_colon);
    case 63: ++tokPos; return finishToken(_question);

    case 96: // '`'
      if (options.ecmaVersion >= 6) {
        ++tokPos;
        return finishToken(_bquote, undefined, false);
      }

    case 48: // '0'
      var next = input.charCodeAt(tokPos + 1);
      if (next === 120 || next === 88) return readRadixNumber(16); // '0x', '0X' - hex number
      if (options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return readRadixNumber(8); // '0o', '0O' - octal number
        if (next === 98 || next === 66) return readRadixNumber(2); // '0b', '0B' - binary number
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return readNumber(false);

    // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47: // '/'
      return readToken_slash();

    case 37: case 42: // '%*'
      return readToken_mult_modulo(code);

    case 124: case 38: // '|&'
      return readToken_pipe_amp(code);

    case 94: // '^'
      return readToken_caret();

    case 43: case 45: // '+-'
      return readToken_plus_min(code);

    case 60: case 62: // '<>'
      return readToken_lt_gt(code);

    case 61: case 33: // '=!'
      return readToken_eq_excl(code);

    case 126: // '~'
      return finishOp(_prefix, 1);
    }

    return false;
  }

  function readToken(forceRegexp) {
    if (!forceRegexp) tokStart = tokPos;
    else tokPos = tokStart + 1;
    if (options.locations) tokStartLoc = new Position;
    if (forceRegexp) return readRegexp();
    if (tokPos >= inputLen) return finishToken(_eof);

    var code = input.charCodeAt(tokPos);

    if (inTemplate) return getTemplateToken(code);

    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();

    var tok = getTokenFromCode(code);

    if (tok === false) {
      // If we are here, we either found a non-ASCII identifier
      // character, or something that's entirely disallowed.
      var ch = String.fromCharCode(code);
      if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
      raise(tokPos, "Unexpected character '" + ch + "'");
    }
    return tok;
  }

  function finishOp(type, size) {
    var str = input.slice(tokPos, tokPos + size);
    tokPos += size;
    finishToken(type, str);
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function readRegexp() {
    var content = "", escaped, inClass, start = tokPos;
    for (;;) {
      if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
      var ch = input.charAt(tokPos);
      if (newline.test(ch)) raise(start, "Unterminated regular expression");
      if (!escaped) {
        if (ch === "[") inClass = true;
        else if (ch === "]" && inClass) inClass = false;
        else if (ch === "/" && !inClass) break;
        escaped = ch === "\\";
      } else escaped = false;
      ++tokPos;
    }
    var content = input.slice(start, tokPos);
    ++tokPos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = readWord1();
    if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regular expression flag");
    try {
      var value = new RegExp(content, mods);
    } catch (e) {
      if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
      raise(e);
    }
    return finishToken(_regexp, value);
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  function readInt(radix, len) {
    var start = tokPos, total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = input.charCodeAt(tokPos), val;
      if (code >= 97) val = code - 97 + 10; // a
      else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
      else val = Infinity;
      if (val >= radix) break;
      ++tokPos;
      total = total * radix + val;
    }
    if (tokPos === start || len != null && tokPos - start !== len) return null;

    return total;
  }

  function readRadixNumber(radix) {
    tokPos += 2; // 0x
    var val = readInt(radix);
    if (val == null) raise(tokStart + 2, "Expected number in radix " + radix);
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
    return finishToken(_num, val);
  }

  // Read an integer, octal integer, or floating-point number.

  function readNumber(startsWithDot) {
    var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
    if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
    if (input.charCodeAt(tokPos) === 46) {
      ++tokPos;
      readInt(10);
      isFloat = true;
    }
    var next = input.charCodeAt(tokPos);
    if (next === 69 || next === 101) { // 'eE'
      next = input.charCodeAt(++tokPos);
      if (next === 43 || next === 45) ++tokPos; // '+-'
      if (readInt(10) === null) raise(start, "Invalid number");
      isFloat = true;
    }
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

    var str = input.slice(start, tokPos), val;
    if (isFloat) val = parseFloat(str);
    else if (!octal || str.length === 1) val = parseInt(str, 10);
    else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
    else val = parseInt(str, 8);
    return finishToken(_num, val);
  }

  // Read a string value, interpreting backslash-escapes.

  function readCodePoint() {
    var ch = input.charCodeAt(tokPos), code;

    if (ch === 123) {
      if (options.ecmaVersion < 6) unexpected();
      ++tokPos;
      code = readHexChar(input.indexOf('}', tokPos) - tokPos);
      ++tokPos;
      if (code > 0x10FFFF) unexpected();
    } else {
      code = readHexChar(4);
    }

    // UTF-16 Encoding
    if (code <= 0xFFFF) {
      return String.fromCharCode(code);
    }
    var cu1 = ((code - 0x10000) >> 10) + 0xD800;
    var cu2 = ((code - 0x10000) & 1023) + 0xDC00;
    return String.fromCharCode(cu1, cu2);
  }

  function readString(quote) {
    ++tokPos;
    var out = "";
    for (;;) {
      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
      var ch = input.charCodeAt(tokPos);
      if (ch === quote) {
        ++tokPos;
        return finishToken(_string, out);
      }
      if (ch === 92) { // '\'
        out += readEscapedChar();
      } else {
        ++tokPos;
        if (newline.test(String.fromCharCode(ch))) {
          raise(tokStart, "Unterminated string constant");
        }
        out += String.fromCharCode(ch); // '\'
      }
    }
  }

  function readTmplString() {
    var out = "";
    for (;;) {
      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
      var ch = input.charCodeAt(tokPos);
      if (ch === 96 || ch === 36 && input.charCodeAt(tokPos + 1) === 123) // '`', '${'
        return finishToken(_string, out);
      if (ch === 92) { // '\'
        out += readEscapedChar();
      } else {
        ++tokPos;
        if (newline.test(String.fromCharCode(ch))) {
          if (ch === 13 && input.charCodeAt(tokPos) === 10) {
            ++tokPos;
            ch = 10;
          }
          if (options.locations) {
            ++tokCurLine;
            tokLineStart = tokPos;
          }
        }
        out += String.fromCharCode(ch); // '\'
      }
    }
  }

  // Used to read escaped characters

  function readEscapedChar() {
    var ch = input.charCodeAt(++tokPos);
    var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
    if (octal) octal = octal[0];
    while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
    if (octal === "0") octal = null;
    ++tokPos;
    if (octal) {
      if (strict) raise(tokPos - 2, "Octal literal in strict mode");
      tokPos += octal.length - 1;
      return String.fromCharCode(parseInt(octal, 8));
    } else {
      switch (ch) {
        case 110: return "\n"; // 'n' -> '\n'
        case 114: return "\r"; // 'r' -> '\r'
        case 120: return String.fromCharCode(readHexChar(2)); // 'x'
        case 117: return readCodePoint(); // 'u'
        case 85: return String.fromCharCode(readHexChar(8)); // 'U'
        case 116: return "\t"; // 't' -> '\t'
        case 98: return "\b"; // 'b' -> '\b'
        case 118: return "\u000b"; // 'v' -> '\u000b'
        case 102: return "\f"; // 'f' -> '\f'
        case 48: return "\0"; // 0 -> '\0'
        case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
        case 10: // ' \n'
          if (options.locations) { tokLineStart = tokPos; ++tokCurLine; }
          return "";
        default: return String.fromCharCode(ch);
      }
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  function readHexChar(len) {
    var n = readInt(16, len);
    if (n === null) raise(tokStart, "Bad character escape sequence");
    return n;
  }

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.

  var containsEsc;

  // Read an identifier, and return it as a string. Sets `containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Only builds up the word character-by-character when it actually
  // containeds an escape, as a micro-optimization.

  function readWord1() {
    containsEsc = false;
    var word, first = true, start = tokPos;
    for (;;) {
      var ch = input.charCodeAt(tokPos);
      if (isIdentifierChar(ch)) {
        if (containsEsc) word += input.charAt(tokPos);
        ++tokPos;
      } else if (ch === 92) { // "\"
        if (!containsEsc) word = input.slice(start, tokPos);
        containsEsc = true;
        if (input.charCodeAt(++tokPos) != 117) // "u"
          raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
        ++tokPos;
        var esc = readHexChar(4);
        var escStr = String.fromCharCode(esc);
        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
          raise(tokPos - 4, "Invalid Unicode escape");
        word += escStr;
      } else {
        break;
      }
      first = false;
    }
    return containsEsc ? word : input.slice(start, tokPos);
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  function readWord() {
    var word = readWord1();
    var type = _name;
    if (!containsEsc && isKeyword(word))
      type = keywordTypes[word];
    return finishToken(type, word);
  }

  // ## Parser

  // A recursive descent parser operates by defining functions for all
  // syntactic elements, and recursively calling those, each function
  // advancing the input stream and returning an AST node. Precedence
  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
  // instead of `(!x)[1]` is handled by the fact that the parser
  // function that parses unary prefix operators is called first, and
  // in turn calls the function that parses `[]` subscripts — that
  // way, it'll receive the node for `x[1]` already parsed, and wraps
  // *that* in the unary operator node.
  //
  // Acorn uses an [operator precedence parser][opp] to handle binary
  // operator precedence, because it is much more compact than using
  // the technique outlined above, which uses different, nesting
  // functions to specify precedence, for all of the ten binary
  // precedence levels that JavaScript defines.
  //
  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

  // ### Parser utilities

  // Continue to the next token.

  function next() {
    lastStart = tokStart;
    lastEnd = tokEnd;
    lastEndLoc = tokEndLoc;
    readToken();
  }

  // Enter strict mode. Re-reads the next token to please pedantic
  // tests ("use strict"; 010; -- should fail).

  function setStrict(strct) {
    strict = strct;
    tokPos = tokStart;
    if (options.locations) {
      while (tokPos < tokLineStart) {
        tokLineStart = input.lastIndexOf("\n", tokLineStart - 2) + 1;
        --tokCurLine;
      }
    }
    skipSpace();
    readToken();
  }

  // Start an AST node, attaching a start offset.

  function Node() {
    this.type = null;
    this.start = tokStart;
    this.end = null;
  }

  exports.Node = Node;

  function SourceLocation() {
    this.start = tokStartLoc;
    this.end = null;
    if (sourceFile !== null) this.source = sourceFile;
  }

  function startNode() {
    var node = new Node();
    if (options.locations)
      node.loc = new SourceLocation();
    if (options.directSourceFile)
      node.sourceFile = options.directSourceFile;
    if (options.ranges)
      node.range = [tokStart, 0];
    return node;
  }

  // Start a node whose start offset information should be based on
  // the start of another node. For example, a binary operator node is
  // only started after its left-hand side has already been parsed.

  function startNodeFrom(other) {
    var node = new Node();
    node.start = other.start;
    if (options.locations) {
      node.loc = new SourceLocation();
      node.loc.start = other.loc.start;
    }
    if (options.ranges)
      node.range = [other.range[0], 0];

    return node;
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNode(node, type) {
    node.type = type;
    node.end = lastEnd;
    if (options.locations)
      node.loc.end = lastEndLoc;
    if (options.ranges)
      node.range[1] = lastEnd;
    return node;
  }

  // Test whether a statement node is the string literal `"use strict"`.

  function isUseStrict(stmt) {
    return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  function eat(type) {
    if (tokType === type) {
      next();
      return true;
    } else {
      return false;
    }
  }

  // Test whether a semicolon can be inserted at the current position.

  function canInsertSemicolon() {
    return !options.strictSemicolons &&
      (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  function semicolon() {
    if (!eat(_semi) && !canInsertSemicolon()) unexpected();
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  function expect(type) {
    eat(type) || unexpected();
  }

  // Raise an unexpected token error.

  function unexpected(pos) {
    raise(pos != null ? pos : tokStart, "Unexpected token");
  }

  // Checks if hash object has a property.

  function has(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName);
  }
  // Convert existing expression atom to assignable pattern
  // if possible.

  function toAssignable(node, allowSpread, checkType) {
    if (options.ecmaVersion >= 6 && node) {
      switch (node.type) {
        case "Identifier":
        case "MemberExpression":
          break;

        case "ObjectExpression":
          node.type = "ObjectPattern";
          for (var i = 0; i < node.properties.length; i++) {
            var prop = node.properties[i];
            if (prop.kind !== "init") unexpected(prop.key.start);
            toAssignable(prop.value, false, checkType);
          }
          break;

        case "ArrayExpression":
          node.type = "ArrayPattern";
          for (var i = 0, lastI = node.elements.length - 1; i <= lastI; i++) {
            toAssignable(node.elements[i], i === lastI, checkType);
          }
          break;

        case "SpreadElement":
          if (allowSpread) {
            toAssignable(node.argument, false, checkType);
            checkSpreadAssign(node.argument);
          } else {
            unexpected(node.start);
          }
          break;

        default:
          if (checkType) unexpected(node.start);
      }
    }
    return node;
  }

  // Checks if node can be assignable spread argument.

  function checkSpreadAssign(node) {
    if (node.type !== "Identifier" && node.type !== "ArrayPattern")
      unexpected(node.start);
  }

  // Verify that argument names are not repeated, and it does not
  // try to bind the words `eval` or `arguments`.

  function checkFunctionParam(param, nameHash) {
    switch (param.type) {
      case "Identifier":
        if (isStrictReservedWord(param.name) || isStrictBadIdWord(param.name))
          raise(param.start, "Defining '" + param.name + "' in strict mode");
        if (has(nameHash, param.name))
          raise(param.start, "Argument name clash in strict mode");
        nameHash[param.name] = true;
        break;

      case "ObjectPattern":
        for (var i = 0; i < param.properties.length; i++)
          checkFunctionParam(param.properties[i].value, nameHash);
        break;

      case "ArrayPattern":
        for (var i = 0; i < param.elements.length; i++)
          checkFunctionParam(param.elements[i], nameHash);
        break;
    }
  }

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  function checkPropClash(prop, propHash) {
    if (prop.computed) return;
    var key = prop.key, name;
    switch (key.type) {
      case "Identifier": name = key.name; break;
      case "Literal": name = String(key.value); break;
      default: return;
    }
    var kind = prop.kind || "init", other;
    if (has(propHash, name)) {
      other = propHash[name];
      var isGetSet = kind !== "init";
      if ((strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
        raise(key.start, "Redefinition of property");
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      };
    }
    other[kind] = true;
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  function checkLVal(expr, isBinding) {
    switch (expr.type) {
      case "Identifier":
        if (strict && (isStrictBadIdWord(expr.name) || isStrictReservedWord(expr.name)))
          raise(expr.start, isBinding
            ? "Binding " + expr.name + " in strict mode"
            : "Assigning to " + expr.name + " in strict mode"
          );
        break;

      case "MemberExpression":
        if (!isBinding) break;

      case "ObjectPattern":
        for (var i = 0; i < expr.properties.length; i++)
          checkLVal(expr.properties[i].value, isBinding);
        break;

      case "ArrayPattern":
        for (var i = 0; i < expr.elements.length; i++) {
          var elem = expr.elements[i];
          if (elem) checkLVal(elem, isBinding);
        }
        break;

      case "SpreadElement":
        break;

      default:
        raise(expr.start, "Assigning to rvalue");
    }
  }

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  function parseTopLevel(program) {
    var node = program || startNode(), first = true;
    if (!program) node.body = [];
    while (tokType !== _eof) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && isUseStrict(stmt)) setStrict(true);
      first = false;
    }
    return finishNode(node, "Program");
  }

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo);`, where looking at the previous token
  // does not help.

  function parseStatement() {
    if (tokType === _slash || tokType === _assign && tokVal == "/=")
      readToken(true);

    var starttype = tokType, node = startNode();

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case _break: case _continue: return parseBreakContinueStatement(node, starttype.keyword);
    case _debugger: return parseDebuggerStatement(node);
    case _do: return parseDoStatement(node);
    case _for: return parseForStatement(node);
    case _function: return parseFunctionStatement(node);
    case _class: return parseClass(node, true);
    case _if: return parseIfStatement(node);
    case _return: return parseReturnStatement(node);
    case _switch: return parseSwitchStatement(node);
    case _throw: return parseThrowStatement(node);
    case _try: return parseTryStatement(node);
    case _var: case _let: case _const: return parseVarStatement(node, starttype.keyword);
    case _while: return parseWhileStatement(node);
    case _with: return parseWithStatement(node);
    case _braceL: return parseBlock(); // no point creating a function for this
    case _semi: return parseEmptyStatement(node);
    case _export: return parseExport(node);
    case _import: return parseImport(node);

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = tokVal, expr = parseExpression();
      if (starttype === _name && expr.type === "Identifier" && eat(_colon))
        return parseLabeledStatement(node, maybeName, expr);
      else return parseExpressionStatement(node, expr);
    }
  }

  function parseBreakContinueStatement(node, keyword) {
    var isBreak = keyword == "break";
    next();
    if (eat(_semi) || canInsertSemicolon()) node.label = null;
    else if (tokType !== _name) unexpected();
    else {
      node.label = parseIdent();
      semicolon();
    }

    // Verify that there is an actual destination to break or
    // continue to.
    for (var i = 0; i < labels.length; ++i) {
      var lab = labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
        if (node.label && isBreak) break;
      }
    }
    if (i === labels.length) raise(node.start, "Unsyntactic " + keyword);
    return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
  }

  function parseDebuggerStatement(node) {
    next();
    semicolon();
    return finishNode(node, "DebuggerStatement");
  }

  function parseDoStatement(node) {
    next();
    labels.push(loopLabel);
    node.body = parseStatement();
    labels.pop();
    expect(_while);
    node.test = parseParenExpression();
    semicolon();
    return finishNode(node, "DoWhileStatement");
  }

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  function parseForStatement(node) {
    next();
    labels.push(loopLabel);
    expect(_parenL);
    if (tokType === _semi) return parseFor(node, null);
    if (tokType === _var || tokType === _let) {
      var init = startNode(), varKind = tokType.keyword, isLet = tokType === _let;
      next();
      parseVar(init, true, varKind);
      finishNode(init, "VariableDeclaration");
      if ((tokType === _in || (options.ecmaVersion >= 6 && tokType === _name && tokVal === "of")) && init.declarations.length === 1 &&
          !(isLet && init.declarations[0].init))
        return parseForIn(node, init);
      return parseFor(node, init);
    }
    var init = parseExpression(false, true);
    if (tokType === _in || (options.ecmaVersion >= 6 && tokType === _name && tokVal === "of")) {
      checkLVal(init);
      return parseForIn(node, init);
    }
    return parseFor(node, init);
  }

  function parseFunctionStatement(node) {
    next();
    return parseFunction(node, true);
  }

  function parseIfStatement(node) {
    next();
    node.test = parseParenExpression();
    node.consequent = parseStatement();
    node.alternate = eat(_else) ? parseStatement() : null;
    return finishNode(node, "IfStatement");
  }

  function parseReturnStatement(node) {
    if (!inFunction && !options.allowReturnOutsideFunction)
      raise(tokStart, "'return' outside of function");
    next();

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (eat(_semi) || canInsertSemicolon()) node.argument = null;
    else { node.argument = parseExpression(); semicolon(); }
    return finishNode(node, "ReturnStatement");
  }

  function parseSwitchStatement(node) {
    next();
    node.discriminant = parseParenExpression();
    node.cases = [];
    expect(_braceL);
    labels.push(switchLabel);

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    for (var cur, sawDefault; tokType != _braceR;) {
      if (tokType === _case || tokType === _default) {
        var isCase = tokType === _case;
        if (cur) finishNode(cur, "SwitchCase");
        node.cases.push(cur = startNode());
        cur.consequent = [];
        next();
        if (isCase) cur.test = parseExpression();
        else {
          if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
          cur.test = null;
        }
        expect(_colon);
      } else {
        if (!cur) unexpected();
        cur.consequent.push(parseStatement());
      }
    }
    if (cur) finishNode(cur, "SwitchCase");
    next(); // Closing brace
    labels.pop();
    return finishNode(node, "SwitchStatement");
  }

  function parseThrowStatement(node) {
    next();
    if (newline.test(input.slice(lastEnd, tokStart)))
      raise(lastEnd, "Illegal newline after throw");
    node.argument = parseExpression();
    semicolon();
    return finishNode(node, "ThrowStatement");
  }

  function parseTryStatement(node) {
    next();
    node.block = parseBlock();
    node.handler = null;
    if (tokType === _catch) {
      var clause = startNode();
      next();
      expect(_parenL);
      clause.param = parseIdent();
      if (strict && isStrictBadIdWord(clause.param.name))
        raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
      expect(_parenR);
      clause.guard = null;
      clause.body = parseBlock();
      node.handler = finishNode(clause, "CatchClause");
    }
    node.guardedHandlers = empty;
    node.finalizer = eat(_finally) ? parseBlock() : null;
    if (!node.handler && !node.finalizer)
      raise(node.start, "Missing catch or finally clause");
    return finishNode(node, "TryStatement");
  }

  function parseVarStatement(node, kind) {
    next();
    parseVar(node, false, kind);
    semicolon();
    return finishNode(node, "VariableDeclaration");
  }

  function parseWhileStatement(node) {
    next();
    node.test = parseParenExpression();
    labels.push(loopLabel);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "WhileStatement");
  }

  function parseWithStatement(node) {
    if (strict) raise(tokStart, "'with' in strict mode");
    next();
    node.object = parseParenExpression();
    node.body = parseStatement();
    return finishNode(node, "WithStatement");
  }

  function parseEmptyStatement(node) {
    next();
    return finishNode(node, "EmptyStatement");
  }

  function parseLabeledStatement(node, maybeName, expr) {
    for (var i = 0; i < labels.length; ++i)
      if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
    var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
    labels.push({name: maybeName, kind: kind});
    node.body = parseStatement();
    labels.pop();
    node.label = expr;
    return finishNode(node, "LabeledStatement");
  }

  function parseExpressionStatement(node, expr) {
    node.expression = expr;
    semicolon();
    return finishNode(node, "ExpressionStatement");
  }

  // Used for constructs like `switch` and `if` that insist on
  // parentheses around their expression.

  function parseParenExpression() {
    expect(_parenL);
    var val = parseExpression();
    expect(_parenR);
    return val;
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  function parseBlock(allowStrict) {
    var node = startNode(), first = true, oldStrict;
    node.body = [];
    expect(_braceL);
    while (!eat(_braceR)) {
      var stmt = parseStatement();
      node.body.push(stmt);
      if (first && allowStrict && isUseStrict(stmt)) {
        oldStrict = strict;
        setStrict(strict = true);
      }
      first = false;
    }
    if (oldStrict === false) setStrict(false);
    return finishNode(node, "BlockStatement");
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  function parseFor(node, init) {
    node.init = init;
    expect(_semi);
    node.test = tokType === _semi ? null : parseExpression();
    expect(_semi);
    node.update = tokType === _parenR ? null : parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, "ForStatement");
  }

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  function parseForIn(node, init) {
    var type = tokType === _in ? "ForInStatement" : "ForOfStatement";
    next();
    node.left = init;
    node.right = parseExpression();
    expect(_parenR);
    node.body = parseStatement();
    labels.pop();
    return finishNode(node, type);
  }

  // Parse a list of variable declarations.

  function parseVar(node, noIn, kind) {
    node.declarations = [];
    node.kind = kind;
    for (;;) {
      var decl = startNode();
      decl.id = options.ecmaVersion >= 6 ? toAssignable(parseExprAtom()) : parseIdent();
      checkLVal(decl.id, true);
      decl.init = eat(_eq) ? parseExpression(true, noIn) : (kind === _const.keyword ? unexpected() : null);
      node.declarations.push(finishNode(decl, "VariableDeclarator"));
      if (!eat(_comma)) break;
    }
    return node;
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The arguments are used to forbid comma
  // sequences (in argument lists, array literals, or object literals)
  // or the `in` operator (in for loops initalization expressions).

  function parseExpression(noComma, noIn) {
    var expr = parseMaybeAssign(noIn);
    if (!noComma && tokType === _comma) {
      var node = startNodeFrom(expr);
      node.expressions = [expr];
      while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
      return finishNode(node, "SequenceExpression");
    }
    return expr;
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  function parseMaybeAssign(noIn) {
    var left = parseMaybeConditional(noIn);
    if (tokType.isAssign) {
      var node = startNodeFrom(left);
      node.operator = tokVal;
      node.left = tokType === _eq ? toAssignable(left) : left;
      checkLVal(left);
      next();
      node.right = parseMaybeAssign(noIn);
      return finishNode(node, "AssignmentExpression");
    }
    return left;
  }

  // Parse a ternary conditional (`?:`) operator.

  function parseMaybeConditional(noIn) {
    var expr = parseExprOps(noIn);
    if (eat(_question)) {
      var node = startNodeFrom(expr);
      node.test = expr;
      node.consequent = parseExpression(true);
      expect(_colon);
      node.alternate = parseExpression(true, noIn);
      return finishNode(node, "ConditionalExpression");
    }
    return expr;
  }

  // Start the precedence parser.

  function parseExprOps(noIn) {
    return parseExprOp(parseMaybeUnary(), -1, noIn);
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  function parseExprOp(left, minPrec, noIn) {
    var prec = tokType.binop;
    if (prec != null && (!noIn || tokType !== _in)) {
      if (prec > minPrec) {
        var node = startNodeFrom(left);
        node.left = left;
        node.operator = tokVal;
        var op = tokType;
        next();
        node.right = parseExprOp(parseMaybeUnary(), prec, noIn);
        var exprNode = finishNode(node, (op === _logicalOR || op === _logicalAND) ? "LogicalExpression" : "BinaryExpression");
        return parseExprOp(exprNode, minPrec, noIn);
      }
    }
    return left;
  }

  // Parse unary operators, both prefix and postfix.

  function parseMaybeUnary() {
    if (tokType.prefix) {
      var node = startNode(), update = tokType.isUpdate;
      node.operator = tokVal;
      node.prefix = true;
      tokRegexpAllowed = true;
      next();
      node.argument = parseMaybeUnary();
      if (update) checkLVal(node.argument);
      else if (strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        raise(node.start, "Deleting local variable in strict mode");
      return finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    }
    var expr = parseExprSubscripts();
    while (tokType.postfix && !canInsertSemicolon()) {
      var node = startNodeFrom(expr);
      node.operator = tokVal;
      node.prefix = false;
      node.argument = expr;
      checkLVal(expr);
      next();
      expr = finishNode(node, "UpdateExpression");
    }
    return expr;
  }

  // Parse call, dot, and `[]`-subscript expressions.

  function parseExprSubscripts() {
    return parseSubscripts(parseExprAtom());
  }

  function parseSubscripts(base, noCalls) {
    if (eat(_dot)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseIdent(true);
      node.computed = false;
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (eat(_bracketL)) {
      var node = startNodeFrom(base);
      node.object = base;
      node.property = parseExpression();
      node.computed = true;
      expect(_bracketR);
      return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
    } else if (!noCalls && eat(_parenL)) {
      var node = startNodeFrom(base);
      node.callee = base;
      node.arguments = parseExprList(_parenR, false);
      return parseSubscripts(finishNode(node, "CallExpression"), noCalls);
    } else if (tokType === _bquote) {
      var node = startNodeFrom(base);
      node.tag = base;
      node.quasi = parseTemplate();
      return parseSubscripts(finishNode(node, "TaggedTemplateExpression"), noCalls);
    } return base;
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  function parseExprAtom() {
    switch (tokType) {
    case _this:
      var node = startNode();
      next();
      return finishNode(node, "ThisExpression");

    case _yield:
      if (inGenerator) return parseYield();

    case _name:
      var id = parseIdent(tokType !== _name);
      if (eat(_arrow)) {
        return parseArrowExpression(startNodeFrom(id), [id]);
      }
      return id;

    case _num: case _string: case _regexp:
      var node = startNode();
      node.value = tokVal;
      node.raw = input.slice(tokStart, tokEnd);
      next();
      return finishNode(node, "Literal");

    case _null: case _true: case _false:
      var node = startNode();
      node.value = tokType.atomValue;
      node.raw = tokType.keyword;
      next();
      return finishNode(node, "Literal");

    case _parenL:
      var tokStartLoc1 = tokStartLoc, tokStart1 = tokStart, val, exprList;
      next();
      // check whether this is generator comprehension or regular expression
      if (options.ecmaVersion >= 6 && tokType === _for) {
        val = parseComprehension(startNode(), true);
      } else {
        var oldParenL = ++metParenL;
        if (tokType !== _parenR) {
          val = parseExpression();
          exprList = val.type === "SequenceExpression" ? val.expressions : [val];
        } else {
          exprList = [];
        }
        expect(_parenR);
        // if '=>' follows '(...)', convert contents to arguments
        if (metParenL === oldParenL && eat(_arrow)) {
          val = parseArrowExpression(startNode(), exprList);
        } else {
          // forbid '()' before everything but '=>'
          if (!val) unexpected(lastStart);
          // forbid '...' in sequence expressions
          if (options.ecmaVersion >= 6) {
            for (var i = 0; i < exprList.length; i++) {
              if (exprList[i].type === "SpreadElement") unexpected();
            }
          }
        }
      }
      val.start = tokStart1;
      val.end = lastEnd;
      if (options.locations) {
        val.loc.start = tokStartLoc1;
        val.loc.end = lastEndLoc;
      }
      if (options.ranges) {
        val.range = [tokStart1, lastEnd];
      }
      return val;

    case _bracketL:
      var node = startNode();
      next();
      // check whether this is array comprehension or regular array
      if (options.ecmaVersion >= 6 && tokType === _for) {
        return parseComprehension(node, false);
      }
      node.elements = parseExprList(_bracketR, true, true);
      return finishNode(node, "ArrayExpression");

    case _braceL:
      return parseObj();

    case _function:
      var node = startNode();
      next();
      return parseFunction(node, false);

    case _class:
      return parseClass(startNode(), false);

    case _new:
      return parseNew();

    case _ellipsis:
      return parseSpread();

    case _bquote:
      return parseTemplate();

    default:
      unexpected();
    }
  }

  // New's precedence is slightly tricky. It must allow its argument
  // to be a `[]` or dot subscript expression, but not a call — at
  // least, not without wrapping it in parentheses. Thus, it uses the

  function parseNew() {
    var node = startNode();
    next();
    node.callee = parseSubscripts(parseExprAtom(), true);
    if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
    else node.arguments = empty;
    return finishNode(node, "NewExpression");
  }

  // Parse spread element '...expr'

  function parseSpread() {
    var node = startNode();
    next();
    node.argument = parseExpression(true);
    return finishNode(node, "SpreadElement");
  }

  // Parse template expression.

  function parseTemplate() {
    var node = startNode();
    node.expressions = [];
    node.quasis = [];
    inTemplate = true;
    next();
    for (;;) {
      var elem = startNode();
      elem.value = {cooked: tokVal, raw: input.slice(tokStart, tokEnd)};
      elem.tail = false;
      next();
      node.quasis.push(finishNode(elem, "TemplateElement"));
      if (tokType === _bquote) { // '`', end of template
        elem.tail = true;
        break;
      }
      inTemplate = false;
      expect(_dollarBraceL);
      node.expressions.push(parseExpression());
      inTemplate = true;
      // hack to include previously skipped space
      tokPos = tokEnd;
      expect(_braceR);
    }
    inTemplate = false;
    next();
    return finishNode(node, "TemplateLiteral");
  }

  // Parse an object literal.

  function parseObj() {
    var node = startNode(), first = true, propHash = {};
    node.properties = [];
    next();
    while (!eat(_braceR)) {
      if (!first) {
        expect(_comma);
        if (options.allowTrailingCommas && eat(_braceR)) break;
      } else first = false;

      var prop = startNode(), isGenerator;
      if (options.ecmaVersion >= 6) {
        prop.method = false;
        prop.shorthand = false;
        isGenerator = eat(_star);
      }
      parsePropertyName(prop);
      if (eat(_colon)) {
        prop.value = parseExpression(true);
        prop.kind = "init";
      } else if (options.ecmaVersion >= 6 && tokType === _parenL) {
        prop.kind = "init";
        prop.method = true;
        prop.value = parseMethod(isGenerator);
      } else if (options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
                 (prop.key.name === "get" || prop.key.name === "set")) {
        if (isGenerator) unexpected();
        prop.kind = prop.key.name;
        parsePropertyName(prop);
        prop.value = parseMethod(false);
      } else if (options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
        prop.kind = "init";
        prop.value = prop.key;
        prop.shorthand = true;
      } else unexpected();

      checkPropClash(prop, propHash);
      node.properties.push(finishNode(prop, "Property"));
    }
    return finishNode(node, "ObjectExpression");
  }

  function parsePropertyName(prop) {
    if (options.ecmaVersion >= 6) {
      if (eat(_bracketL)) {
        prop.computed = true;
        prop.key = parseExpression();
        expect(_bracketR);
        return;
      } else {
        prop.computed = false;
      }
    }
    prop.key = (tokType === _num || tokType === _string) ? parseExprAtom() : parseIdent(true);
  }

  // Initialize empty function node.

  function initFunction(node) {
    node.id = null;
    node.params = [];
    if (options.ecmaVersion >= 6) {
      node.defaults = [];
      node.rest = null;
      node.generator = false;
    }
  }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  function parseFunction(node, isStatement, allowExpressionBody) {
    initFunction(node);
    if (options.ecmaVersion >= 6) {
      node.generator = eat(_star);
    }
    if (isStatement || tokType === _name) {
      node.id = parseIdent();
    }
    parseFunctionParams(node);
    parseFunctionBody(node, allowExpressionBody);
    return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
  }

  // Parse object or class method.

  function parseMethod(isGenerator) {
    var node = startNode();
    initFunction(node);
    parseFunctionParams(node);
    var allowExpressionBody;
    if (options.ecmaVersion >= 6) {
      node.generator = isGenerator;
      allowExpressionBody = true;
    } else {
      allowExpressionBody = false;
    }
    parseFunctionBody(node, allowExpressionBody);
    return finishNode(node, "FunctionExpression");
  }

  // Parse arrow function expression with given parameters.

  function parseArrowExpression(node, params) {
    initFunction(node);

    var defaults = node.defaults, hasDefaults = false;

    for (var i = 0, lastI = params.length - 1; i <= lastI; i++) {
      var param = params[i];

      if (param.type === "AssignmentExpression" && param.operator === "=") {
        hasDefaults = true;
        params[i] = param.left;
        defaults.push(param.right);
      } else {
        toAssignable(param, i === lastI, true);
        defaults.push(null);
        if (param.type === "SpreadElement") {
          params.length--;
          node.rest = param.argument;
          break;
        }
      }
    }

    node.params = params;
    if (!hasDefaults) node.defaults = [];

    parseFunctionBody(node, true);
    return finishNode(node, "ArrowFunctionExpression");
  }

  // Parse function parameters.

  function parseFunctionParams(node) {
    var defaults = [], hasDefaults = false;

    expect(_parenL);
    for (;;) {
      if (eat(_parenR)) {
        break;
      } else if (options.ecmaVersion >= 6 && eat(_ellipsis)) {
        node.rest = toAssignable(parseExprAtom(), false, true);
        checkSpreadAssign(node.rest);
        expect(_parenR);
        defaults.push(null);
        break;
      } else {
        node.params.push(options.ecmaVersion >= 6 ? toAssignable(parseExprAtom(), false, true) : parseIdent());
        if (options.ecmaVersion >= 6) {
          if (eat(_eq)) {
            hasDefaults = true;
            defaults.push(parseExpression(true));
          } else {
            defaults.push(null);
          }
        }
        if (!eat(_comma)) {
          expect(_parenR);
          break;
        }
      }
    }

    if (hasDefaults) node.defaults = defaults;
  }

  // Parse function body and check parameters.

  function parseFunctionBody(node, allowExpression) {
    var isExpression = allowExpression && tokType !== _braceL;

    if (isExpression) {
      node.body = parseExpression(true);
      node.expression = true;
    } else {
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldInFunc = inFunction, oldInGen = inGenerator, oldLabels = labels;
      inFunction = true; inGenerator = node.generator; labels = [];
      node.body = parseBlock(true);
      node.expression = false;
      inFunction = oldInFunc; inGenerator = oldInGen; labels = oldLabels;
    }

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    if (strict || !isExpression && node.body.body.length && isUseStrict(node.body.body[0])) {
      var nameHash = {};
      if (node.id)
        checkFunctionParam(node.id, {});
      for (var i = 0; i < node.params.length; i++)
        checkFunctionParam(node.params[i], nameHash);
      if (node.rest)
        checkFunctionParam(node.rest, nameHash);
    }
  }

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  function parseClass(node, isStatement) {
    next();
    node.id = tokType === _name ? parseIdent() : isStatement ? unexpected() : null;
    node.superClass = eat(_extends) ? parseExpression() : null;
    var classBody = startNode(), methodHash = {}, staticMethodHash = {};
    classBody.body = [];
    expect(_braceL);
    while (!eat(_braceR)) {
      var method = startNode();
      if (tokType === _name && tokVal === "static") {
        next();
        method['static'] = true;
      } else {
        method['static'] = false;
      }
      var isGenerator = eat(_star);
      parsePropertyName(method);
      if (tokType === _name && !method.computed && method.key.type === "Identifier" &&
          (method.key.name === "get" || method.key.name === "set")) {
        if (isGenerator) unexpected();
        method.kind = method.key.name;
        parsePropertyName(method);
      } else {
        method.kind = "";
      }
      method.value = parseMethod(isGenerator);
      checkPropClash(method, method['static'] ? staticMethodHash : methodHash);
      classBody.body.push(finishNode(method, "MethodDefinition"));
      eat(_semi);
    }
    node.body = finishNode(classBody, "ClassBody");
    return finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  function parseExprList(close, allowTrailingComma, allowEmpty) {
    var elts = [], first = true;
    while (!eat(close)) {
      if (!first) {
        expect(_comma);
        if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
      } else first = false;

      if (allowEmpty && tokType === _comma) elts.push(null);
      else elts.push(parseExpression(true));
    }
    return elts;
  }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  function parseIdent(liberal) {
    var node = startNode();
    if (liberal && options.forbidReserved == "everywhere") liberal = false;
    if (tokType === _name) {
      if (!liberal &&
          (options.forbidReserved &&
           (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(tokVal) ||
           strict && isStrictReservedWord(tokVal)) &&
          input.slice(tokStart, tokEnd).indexOf("\\") == -1)
        raise(tokStart, "The keyword '" + tokVal + "' is reserved");
      node.name = tokVal;
    } else if (liberal && tokType.keyword) {
      node.name = tokType.keyword;
    } else {
      unexpected();
    }
    tokRegexpAllowed = false;
    next();
    return finishNode(node, "Identifier");
  }

  // Parses module export declaration.

  function parseExport(node) {
    next();
    // export var|const|let|function|class ...;
    if (tokType === _var || tokType === _const || tokType === _let || tokType === _function || tokType === _class) {
      node.declaration = parseStatement();
      node['default'] = false;
      node.specifiers = null;
      node.source = null;
    } else
    // export default ...;
    if (eat(_default)) {
      node.declaration = parseExpression(true);
      node['default'] = true;
      node.specifiers = null;
      node.source = null;
      semicolon();
    } else {
      // export * from '...'
      // export { x, y as z } [from '...']
      var isBatch = tokType === _star;
      node.declaration = null;
      node['default'] = false;
      node.specifiers = parseExportSpecifiers();
      if (tokType === _name && tokVal === "from") {
        next();
        node.source = tokType === _string ? parseExprAtom() : unexpected();
      } else {
        if (isBatch) unexpected();
        node.source = null;
      }
    }
    return finishNode(node, "ExportDeclaration");
  }

  // Parses a comma-separated list of module exports.

  function parseExportSpecifiers() {
    var nodes = [], first = true;
    if (tokType === _star) {
      // export * from '...'
      var node = startNode();
      next();
      nodes.push(finishNode(node, "ExportBatchSpecifier"));
    } else {
      // export { x, y as z } [from '...']
      expect(_braceL);
      while (!eat(_braceR)) {
        if (!first) {
          expect(_comma);
          if (options.allowTrailingCommas && eat(_braceR)) break;
        } else first = false;

        var node = startNode();
        node.id = parseIdent();
        if (tokType === _name && tokVal === "as") {
          next();
          node.name = parseIdent(true);
        } else {
          node.name = null;
        }
        nodes.push(finishNode(node, "ExportSpecifier"));
      }
    }
    return nodes;
  }

  // Parses import declaration.

  function parseImport(node) {
    next();
    // import '...';
    if (tokType === _string) {
      node.specifiers = [];
      node.source = parseExprAtom();
      node.kind = "";
    } else {
      node.specifiers = parseImportSpecifiers();
      if (tokType !== _name || tokVal !== "from") unexpected();
      next();
      node.source = tokType === _string ? parseExprAtom() : unexpected();
      // only for backward compatibility with Esprima's AST
      // (it doesn't support mixed default + named yet)
      node.kind = node.specifiers[0]['default'] ? "default" : "named";
    }
    return finishNode(node, "ImportDeclaration");
  }

  // Parses a comma-separated list of module imports.

  function parseImportSpecifiers() {
    var nodes = [], first = true;
    if (tokType === _star) {
      var node = startNode();
      next();
      if (tokType !== _name || tokVal !== "as") unexpected();
      next();
      node.name = parseIdent();
      checkLVal(node.name, true);
      nodes.push(finishNode(node, "ImportBatchSpecifier"));
      return nodes;
    }
    if (tokType === _name) {
      // import defaultObj, { x, y as z } from '...'
      var node = startNode();
      node.id = parseIdent();
      checkLVal(node.id, true);
      node.name = null;
      node['default'] = true;
      nodes.push(finishNode(node, "ImportSpecifier"));
      if (!eat(_comma)) return nodes;
    }
    expect(_braceL);
    while (!eat(_braceR)) {
      if (!first) {
        expect(_comma);
        if (options.allowTrailingCommas && eat(_braceR)) break;
      } else first = false;

      var node = startNode();
      node.id = parseIdent(true);
      if (tokType === _name && tokVal === "as") {
        next();
        node.name = parseIdent();
      } else {
        node.name = null;
      }
      checkLVal(node.name || node.id, true);
      node['default'] = false;
      nodes.push(finishNode(node, "ImportSpecifier"));
    }
    return nodes;
  }

  // Parses yield expression inside generator.

  function parseYield() {
    var node = startNode();
    next();
    if (eat(_semi) || canInsertSemicolon()) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = eat(_star);
      node.argument = parseExpression(true);
    }
    return finishNode(node, "YieldExpression");
  }

  // Parses array and generator comprehensions.

  function parseComprehension(node, isGenerator) {
    node.blocks = [];
    while (tokType === _for) {
      var block = startNode();
      next();
      expect(_parenL);
      block.left = toAssignable(parseExprAtom());
      checkLVal(block.left, true);
      if (tokType !== _name || tokVal !== "of") unexpected();
      next();
      // `of` property is here for compatibility with Esprima's AST
      // which also supports deprecated [for (... in ...) expr]
      block.of = true;
      block.right = parseExpression();
      expect(_parenR);
      node.blocks.push(finishNode(block, "ComprehensionBlock"));
    }
    node.filter = eat(_if) ? parseParenExpression() : null;
    node.body = parseExpression();
    expect(isGenerator ? _parenR : _bracketR);
    node.generator = isGenerator;
    return finishNode(node, "ComprehensionExpression");
  }

});
/*
 * Copyright 2013 Samsung Information Systems America, Inc.
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

// Author: Koushik Sen
// Author: Manu Sridharan

/*jslint node: true */
/*global window */

(function () {
    function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    /**
     * name of the global variable holding the Jalangi runtime objects
     */
    var JALANGI_VAR = "J$";

    /**
     * information on surrounding AST context, to be used by visitors passed
     * to transformAst()
     */
    var CONTEXT = {
        // TODO what is this?
        RHS:1,
        // TODO what is this?
        IGNORE:2,
        // inside the properties of an ObjectExpression
        OEXP:3,
        // inside the formal parameters of a FunctionDeclaration or FunctionExpression
        PARAMS:4,
        // TODO what is this?
        OEXP2:5,
        // inside a getter
        GETTER:6,
        // inside a setter
        SETTER:7
    };

    /**
     * invoked by transformAst() to see if a sub-ast should be ignored.  For now,
     * only ignoring calls to J$.I()
     */
    function ignoreSubAst(node) {
        return node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' && node.callee.object.name === JALANGI_VAR &&
            node.callee.property.type === 'Identifier' && node.callee.property.name === 'I';
    }

    /**
     * generic AST visitor that allows for AST transformation.
     *
     * @param object the root AST node to be visited
     * @param visitorPost an object defining visitor methods to be executed after a node's children
     * have been visited.  The properties of visitorPost should be named with AST node types, and the
     * property values should be functions that take the node to be visited and a context value (see
     * the CONTEXT object above).  E.g., a post-visitor could be:
     * { 'AssignmentExpression': function (node, context) {
     *      // node.type === 'AssignmentExpression'
     *   }
     * }
     * The value returned by the visitorPost method for a node will replace the node in the AST.
     * @param visitorPre an object defining visitor methods to be executed before a node's children
     * have been visited.  Structure should be similar to visitorPost (see above).  The return value
     * of visitorPre functions is ignored.
     * @param context the context of the surrounding AST; see the CONTEXT object above
     * @param {boolean?} noIgnore if true, no sub-ast will be ignored.  Otherwise, sub-ASTs will be ignored
     * if ignoreAST() returns true.
     */
    function transformAst(object, visitorPost, visitorPre, context, noIgnore) {
        var key, child, type, ret, newContext;

        type = object.type;
        if (visitorPre && HOP(visitorPre, type)) {
            visitorPre[type](object, context);
        }

        for (key in object) {
//            if (object.hasOwnProperty(key)) {
                child = object[key];
                if (typeof child === 'object' && child !== null && key !== "scope" && (noIgnore || !ignoreSubAst(object))) {
                    if ((type === 'AssignmentExpression' && key === 'left') ||
                        (type === 'UpdateExpression' && key === 'argument') ||
                        (type === 'UnaryExpression' && key === 'argument' && object.operator === 'delete') ||
                        (type === 'ForInStatement' && key === 'left') ||
                        ((type === 'FunctionExpression' || type === 'FunctionDeclaration') && key === 'id') ||
                        (type === 'LabeledStatement' && key === 'label') ||
                        (type === 'BreakStatement' && key === 'label') ||
                        (type === 'CatchClause' && key === 'param') ||
                        (type === 'ContinueStatement' && key === 'label') ||
                        ((type === 'CallExpression' || type === 'NewExpression') &&
                            key === 'callee' &&
                            (object.callee.type === 'MemberExpression' ||
                                (object.callee.type === 'Identifier' && object.callee.name === 'eval'))) ||
                        (type === 'VariableDeclarator' && key === 'id') ||
                        (type === 'MemberExpression' && !object.computed && key === 'property')) {
                        newContext = CONTEXT.IGNORE;
                    } else if (type === 'ObjectExpression' && key === 'properties') {
                        newContext = CONTEXT.OEXP;
                    } else if ((type === 'FunctionExpression' || type === 'FunctionDeclaration') && key === 'params') {
                        newContext = CONTEXT.PARAMS;
                    } else if (context === CONTEXT.OEXP) {
                        newContext = CONTEXT.OEXP2;
                    } else if (context === CONTEXT.OEXP2 && key === 'key') {
                        newContext = CONTEXT.IGNORE;
                    } else if (context === CONTEXT.PARAMS) {
                        newContext = CONTEXT.IGNORE;
                    } else if (object.key && key === 'value' && object.kind === 'get') {
                        newContext = CONTEXT.GETTER;
                    } else if (object.key && key === 'value' && object.kind === 'set') {
                        newContext = CONTEXT.SETTER;
                    } else if (type === 'CallExpression' && key === 'callee' && child.type === 'Identifier' && child.name === 'eval') {
                        newContext = CONTEXT.IGNORE;
                    } else {
                            newContext = CONTEXT.RHS;
                    }
                    object[key] = transformAst(child, visitorPost, visitorPre, newContext, noIgnore);

                }
//            }
        }

        if (visitorPost && HOP(visitorPost, type)) {
            ret = visitorPost[type](object, context);
        } else {
            ret = object;
        }
        return ret;

    }

    /**
     * computes a map from iids to the corresponding AST nodes for root.  The root AST is destructively updated to
     * include SymbolicReference nodes that reference other nodes by iid, in order to save space in the map.
     */
    function serialize(root) {
        // Stores a pointer to the most-recently encountered node representing a function or a
        // top-level script.  We need this stored pointer since a function expression or declaration
        // has no associated IID, but we'd like to have the ASTs as entries in the table.  Instead,
        // we associate the AST with the IID for the corresponding function-enter or script-enter IID.
        // We don't need a stack here since we only use this pointer at the next function-enter or script-enter,
        // and there cannot be a nested function declaration in-between.
        var parentFunOrScript = root;
        var iidToAstTable = {};

        function handleFun(node) {
            parentFunOrScript = node;
        }

        var visitorPre = {
            'Program':handleFun,
            'FunctionDeclaration':handleFun,
            'FunctionExpression':handleFun
        };

        function canMakeSymbolic(node) {
            if (node.callee.object) {
                var callee = node.callee;
                // we can replace calls to J$ functions with a SymbolicReference iff they have an IID as their first
                // argument.  'instrumentCode', 'getConcrete', and 'I' do not take an IID.
                // TODO are we missing other cases?
                if (callee.object.name === 'J$' && callee.property.name !== "instrumentCode" &&
                    callee.property.name !== "getConcrete" &&
                    callee.property.name !== "I" && node.arguments[0]) {
                    return true;
                }
            }
            return false;
        }

        function setSerializedAST(iid, ast) {
            var entry = iidToAstTable[iid];
            if (!entry) {
                entry = {};
                iidToAstTable[iid] = entry;
            }
            entry.serializedAST = ast;
        }
        var visitorPost = {
            'CallExpression':function (node) {
                try {
                    if (node.callee.object && node.callee.object.name === 'J$' && (node.callee.property.name === 'Se' || node.callee.property.name === 'Fe')) {
                        // associate IID with the AST of the containing function / script
                        setSerializedAST(node.arguments[0].value, parentFunOrScript);
                        return node;
                    } else if (canMakeSymbolic(node)) {
                        setSerializedAST(node.arguments[0].value, node);
                        return {type:"SymbolicReference", value:node.arguments[0].value};
                    }
                    return node;
                } catch (e) {
                    console.log(JSON.stringify(node));
                    throw e;
                }
            }
        };

        transformAst(root, visitorPost, visitorPre);
        return iidToAstTable;
    }

    /**
     * given an iidToAstTable constructed by the serialize() function, destructively
     * update the AST values to remove SymbolicReference nodes, replacing them with a
     * pointer to the appropriate actual AST node.
     */
    function deserialize(iidToAstTable) {
        Object.keys(iidToAstTable).forEach(function (iid) {
            var curAst = iidToAstTable[iid].serializedAST;
            if (curAst) {
                var visitorPost = {
                    'SymbolicReference': function (node) {
                        var targetAST = iidToAstTable[node.value].serializedAST;
                        if (!targetAST) {
                            throw "bad symbolic reference";
                        }
                        return targetAST;
                    }
                };
                transformAst(curAst, visitorPost);
            }
        });
    }

    /**
     * given an instrumented AST, returns an array of IIDs corresponding to "top-level expressions,"
     * i.e., expressions that are not nested within another
     * @param ast
     */
    function computeTopLevelExpressions(ast) {
        var exprDepth = 0;
        var exprDepthStack = [];
        var topLevelExprs = [];
        var visitorIdentifyTopLevelExprPre = {
            "CallExpression":function (node) {
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.object.type === 'Identifier' &&
                    node.callee.object.name === JALANGI_VAR) {
                    var funName = node.callee.property.name;
                    if ((exprDepth === 0 &&
                        (funName === 'A' ||
                            funName === 'P' ||
                            funName === 'G' ||
                            funName === 'R' ||
                            funName === 'W' ||
                            funName === 'H' ||
                            funName === 'T' ||
                            funName === 'Rt' ||
                            funName === 'B' ||
                            funName === 'U' ||
                            funName === 'C' ||
                            funName === 'C1' ||
                            funName === 'C2'
                            )) ||
                        (exprDepth === 1 &&
                            (funName === 'F' ||
                                funName === 'M'))) {
                        topLevelExprs.push(node.arguments[0].value);
                    }
                    exprDepth++;
                } else if (node.callee.type === 'CallExpression' &&
                    node.callee.callee.type === 'MemberExpression' &&
                    node.callee.callee.object.type === 'Identifier' &&
                    node.callee.callee.object.name === JALANGI_VAR &&
                    (node.callee.callee.property.name === 'F' ||
                        node.callee.callee.property.name === 'M')) {
                    exprDepth++;
                }
            },
            "FunctionExpression":function (node, context) {
                exprDepthStack.push(exprDepth);
                exprDepth = 0;
            },
            "FunctionDeclaration":function (node) {
                exprDepthStack.push(exprDepth);
                exprDepth = 0;
            }

        };

        var visitorIdentifyTopLevelExprPost = {
            "CallExpression":function (node) {
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.object.type === 'Identifier' &&
                    node.callee.object.name === JALANGI_VAR) {
                    exprDepth--;
                } else if (node.callee.type === 'CallExpression' &&
                    node.callee.callee.type === 'MemberExpression' &&
                    node.callee.callee.object.type === 'Identifier' &&
                    node.callee.callee.object.name === JALANGI_VAR &&
                    (node.callee.callee.property.name === 'F' ||
                        node.callee.callee.property.name === 'M')) {
                    exprDepth--;
                }
                return node;
            },
            "FunctionExpression":function (node, context) {
                exprDepth = exprDepthStack.pop();
                return node;
            },
            "FunctionDeclaration":function (node) {
                exprDepth = exprDepthStack.pop();
                return node;
            }
        };
        transformAst(ast, visitorIdentifyTopLevelExprPost, visitorIdentifyTopLevelExprPre, CONTEXT.RHS);
        return topLevelExprs;
    }

    // handle node.js and browser
    // TODO use browserify
    var exportObj;
    if (typeof exports === 'undefined') {
        exportObj = {};
        if (typeof window !== 'undefined') {
            window.astUtil = exportObj;
        }
    } else {
        exportObj = exports;
    }
    exportObj.serialize = serialize;
    exportObj.deserialize = deserialize;
    exportObj.JALANGI_VAR = JALANGI_VAR;
    exportObj.CONTEXT = CONTEXT;
    exportObj.transformAst = transformAst;
    exportObj.computeTopLevelExpressions = computeTopLevelExpressions;
})();

/*
 * Copyright 2013 Samsung Information Systems America, Inc.
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

// Author: Koushik Sen

/*jslint node: true browser: true */
/*global astUtil acorn escodegen J$ */

//var StatCollector = require('../utils/StatCollector');

var acorn, escodegen, astUtil;
(function (sandbox) {
    if (typeof acorn === 'undefined') {
        acorn = require("acorn");
        escodegen = require('escodegen');
        astUtil = require("./../utils/astUtil");
        require("../Config");
    }

    var Config = sandbox.Config;
    var FILESUFFIX1 = "_jalangi_";
    var COVERAGE_FILE_NAME = "jalangi_coverage.json";
    var SMAP_FILE_NAME = "jalangi_sourcemap.js";
    var INITIAL_IID_FILE_NAME = "jalangi_initialIID.json";
    var RP = astUtil.JALANGI_VAR + "_";

//    var N_LOG_LOAD = 0,
//    var N_LOG_FUN_CALL = 1,
//        N_LOG_METHOD_CALL = 2,
    var N_LOG_FUNCTION_ENTER = 4,
//        N_LOG_FUNCTION_RETURN = 5,
        N_LOG_SCRIPT_ENTER = 6,
//        N_LOG_SCRIPT_EXIT = 7,
        N_LOG_GETFIELD = 8,
//        N_LOG_GLOBAL = 9,
        N_LOG_ARRAY_LIT = 10,
        N_LOG_OBJECT_LIT = 11,
        N_LOG_FUNCTION_LIT = 12,
        N_LOG_RETURN = 13,
        N_LOG_REGEXP_LIT = 14,
//        N_LOG_LOCAL = 15,
//        N_LOG_OBJECT_NEW = 16,
        N_LOG_READ = 17,
//        N_LOG_FUNCTION_ENTER_NORMAL = 18,
        N_LOG_HASH = 19,
        N_LOG_SPECIAL = 20,
        N_LOG_STRING_LIT = 21,
        N_LOG_NUMBER_LIT = 22,
        N_LOG_BOOLEAN_LIT = 23,
        N_LOG_UNDEFINED_LIT = 24,
        N_LOG_NULL_LIT = 25;

    var logFunctionEnterFunName = astUtil.JALANGI_VAR + ".Fe";
    var logFunctionReturnFunName = astUtil.JALANGI_VAR + ".Fr";
    var logFunCallFunName = astUtil.JALANGI_VAR + ".F";
    var logMethodCallFunName = astUtil.JALANGI_VAR + ".M";
    var logAssignFunName = astUtil.JALANGI_VAR + ".A";
    var logPutFieldFunName = astUtil.JALANGI_VAR + ".P";
    var logGetFieldFunName = astUtil.JALANGI_VAR + ".G";
    var logScriptEntryFunName = astUtil.JALANGI_VAR + ".Se";
    var logScriptExitFunName = astUtil.JALANGI_VAR + ".Sr";
    var logReadFunName = astUtil.JALANGI_VAR + ".R";
    var logWriteFunName = astUtil.JALANGI_VAR + ".W";
    var logIFunName = astUtil.JALANGI_VAR + ".I";
    var logHashFunName = astUtil.JALANGI_VAR + ".H";
    var logLitFunName = astUtil.JALANGI_VAR + ".T";
    var logInitFunName = astUtil.JALANGI_VAR + ".N";
    var logReturnFunName = astUtil.JALANGI_VAR + ".Rt";
    var logReturnAggrFunName = astUtil.JALANGI_VAR + ".Ra";
    var logUncaughtExceptionFunName = astUtil.JALANGI_VAR + ".Ex";

    var logBinaryOpFunName = astUtil.JALANGI_VAR + ".B";
    var logUnaryOpFunName = astUtil.JALANGI_VAR + ".U";
    var logConditionalFunName = astUtil.JALANGI_VAR + ".C";
    var logSwitchLeftFunName = astUtil.JALANGI_VAR + ".C1";
    var logSwitchRightFunName = astUtil.JALANGI_VAR + ".C2";
    var logLastFunName = astUtil.JALANGI_VAR + "._";

    var instrumentCodeFunName = astUtil.JALANGI_VAR + ".instrumentCode";


    var Syntax = {
        AssignmentExpression:'AssignmentExpression',
        ArrayExpression:'ArrayExpression',
        BlockStatement:'BlockStatement',
        BinaryExpression:'BinaryExpression',
        BreakStatement:'BreakStatement',
        CallExpression:'CallExpression',
        CatchClause:'CatchClause',
        ConditionalExpression:'ConditionalExpression',
        ContinueStatement:'ContinueStatement',
        DoWhileStatement:'DoWhileStatement',
        DebuggerStatement:'DebuggerStatement',
        EmptyStatement:'EmptyStatement',
        ExpressionStatement:'ExpressionStatement',
        ForStatement:'ForStatement',
        ForInStatement:'ForInStatement',
        FunctionDeclaration:'FunctionDeclaration',
        FunctionExpression:'FunctionExpression',
        Identifier:'Identifier',
        IfStatement:'IfStatement',
        Literal:'Literal',
        LabeledStatement:'LabeledStatement',
        LogicalExpression:'LogicalExpression',
        MemberExpression:'MemberExpression',
        NewExpression:'NewExpression',
        ObjectExpression:'ObjectExpression',
        Program:'Program',
        Property:'Property',
        ReturnStatement:'ReturnStatement',
        SequenceExpression:'SequenceExpression',
        SwitchStatement:'SwitchStatement',
        SwitchCase:'SwitchCase',
        ThisExpression:'ThisExpression',
        ThrowStatement:'ThrowStatement',
        TryStatement:'TryStatement',
        UnaryExpression:'UnaryExpression',
        UpdateExpression:'UpdateExpression',
        VariableDeclaration:'VariableDeclaration',
        VariableDeclarator:'VariableDeclarator',
        WhileStatement:'WhileStatement',
        WithStatement:'WithStatement'
    };


    function sanitizePath(path) {
        if (typeof process !== 'undefined' && process.platform === "win32") {
            return path.split("\\").join("\\\\");
        }
        return path;
    }

    function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }


    function isArr(val) {
        return Object.prototype.toString.call(val) === '[object Array]';
    }

    function MAP(arr, fun) {
        var len = arr.length;
        if (!isArr(arr)) {
            throw new TypeError();
        }
        if (typeof fun !== "function") {
            throw new TypeError();
        }

        var res = new Array(len);
        for (var i = 0; i < len; i++) {
            if (i in arr) {
                res[i] = fun(arr[i]);
            }
        }
        return res;
    }

    function getCode(filename) {
        var fs = require('fs');
        return fs.readFileSync(filename, "utf8");
    }

    function regex_escape(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    function saveCode(code, isAppend, noInstrEval) {
        var fs = require('fs');
        var path = require('path');
        var n_code = astUtil.JALANGI_VAR + ".noInstrEval = " + noInstrEval + ";\n" + code + "\n";
        if (isAppend) {
            fs.appendFileSync(instCodeFileName, n_code, "utf8");
        } else {
            fs.writeFileSync(instCodeFileName, n_code, "utf8");

        }
    }


    // name of the file containing the instrumented code
    var instCodeFileName;

    var IID_INC_STEP = 8;
    // current static identifier for each conditional expression
    var condCount;
    var iid;
    var opIid;
    var hasInitializedIIDs = false;

    function initializeIIDCounters(forEval) {
        if (!hasInitializedIIDs) {
            var adj = forEval ? IID_INC_STEP / 2 : 0;
            condCount = IID_INC_STEP + adj + 0;
            iid = IID_INC_STEP + adj + 1;
            opIid = IID_INC_STEP + adj + 2;
            hasInitializedIIDs = true;
        }
    }

    function loadInitialIID(outputDir, initIIDs) {
        var path = require('path');
        var fs = require('fs');
        var iidf = path.join(outputDir ? outputDir : process.cwd(), INITIAL_IID_FILE_NAME);

        if (initIIDs) {
            hasInitializedIIDs = false;
            initializeIIDCounters(false);
        } else {
            try {
                var line;
                var iids = JSON.parse(line = fs.readFileSync(iidf, "utf8"));
                condCount = iids.condCount;
                iid = iids.iid;
                opIid = iids.opIid;
                hasInitializedIIDs = true;
            } catch (e) {
                initializeIIDCounters(false);
            }
        }
    }


    function storeInitialIID(outputDir) {
        var path = require('path');
        var fs = require('fs');
        var line;
        var iidf = path.join(outputDir ? outputDir : process.cwd(), INITIAL_IID_FILE_NAME);
        fs.writeFileSync(iidf, line = JSON.stringify({condCount:condCount, iid:iid, opIid:opIid}));
    }

    function getIid() {
        var tmpIid = iid;
        iid = iid + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }

    function getPrevIidNoInc() {
        return createLiteralAst(iid - IID_INC_STEP);
    }

    function getCondIid() {
        var tmpIid = condCount;
        condCount = condCount + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }

    function getOpIid() {
        var tmpIid = opIid;
        opIid = opIid + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }

    // TODO reset this state in openIIDMapFile or its equivalent?
    var curFileName = null;
    var orig2Inst = {};
    var iidSourceInfo = {};

    function writeLineToIIDMap(fs, traceWfh, fh, str) {
        if (fh) {
            fs.writeSync(fh, str);
        }
        fs.writeSync(traceWfh, str);
    }

    /**
     * if not yet open, open the IID map file and write the header.
     * @param {string} outputDir an optional output directory for the sourcemap file
     */

    function writeIIDMapFile(outputDir, initIIDs, isAppend) {
        var traceWfh, fs = require('fs'), path = require('path');
        var smapFile = path.join(outputDir, SMAP_FILE_NAME);
        if (initIIDs) {
            traceWfh = fs.openSync(smapFile, 'w');
        } else {
            traceWfh = fs.openSync(smapFile, 'a');
        }

        var fh = null;
        if (isAppend) {
            fh = fs.openSync(instCodeFileName, 'w');
        }

        writeLineToIIDMap(fs, traceWfh, fh, "(function (sandbox) {\n if (!sandbox.iids) {sandbox.iids = []; sandbox.orig2Inst = {}; }\n");
        writeLineToIIDMap(fs, traceWfh, fh, "var iids = sandbox.iids; var orig2Inst = sandbox.orig2Inst;\n");
        writeLineToIIDMap(fs, traceWfh, fh, "var fn = \"" + curFileName + "\";\n");
        // write all the data
        Object.keys(iidSourceInfo).forEach(function (iid) {
            var sourceInfo = iidSourceInfo[iid];
            writeLineToIIDMap(fs, traceWfh, fh, "iids[" + iid + "] = [fn," + sourceInfo[1] + "," + sourceInfo[2] + "," + sourceInfo[3] + "," + sourceInfo[4] + "];\n");
        });
        Object.keys(orig2Inst).forEach(function (filename) {
            writeLineToIIDMap(fs, traceWfh, fh, "orig2Inst[\"" + filename + "\"] = \"" + orig2Inst[filename] + "\";\n");
        });
        writeLineToIIDMap(fs, traceWfh, fh, "}(typeof " + astUtil.JALANGI_VAR + " === 'undefined'? " + astUtil.JALANGI_VAR + " = {}:" + astUtil.JALANGI_VAR + "));\n");
        fs.closeSync(traceWfh);
        if (isAppend) {
            fs.closeSync(fh);
        }
        // also write output as JSON, to make consumption easier
        var jsonFile = smapFile.replace(/.js$/, '.json');
        var outputObj = [iidSourceInfo, orig2Inst];
        if (!initIIDs && fs.existsSync(jsonFile)) {
            var oldInfo = JSON.parse(fs.readFileSync(jsonFile));
            var oldIIDInfo = oldInfo[0];
            var oldOrig2Inst = oldInfo[1];
            Object.keys(iidSourceInfo).forEach(function (iid) {
                oldIIDInfo[iid] = iidSourceInfo[iid];
            })
            Object.keys(orig2Inst).forEach(function (filename) {
                oldOrig2Inst[filename] = orig2Inst[filename];
            });
            outputObj = [oldIIDInfo, oldOrig2Inst];
        }
        fs.writeFileSync(jsonFile, JSON.stringify(outputObj));
        fs.writeFileSync(path.join(outputDir, COVERAGE_FILE_NAME), JSON.stringify({"covered":0, "branches":condCount / IID_INC_STEP * 2, "coverage":[]}), "utf8");
    }


    function printLineInfoAux(i, ast) {
        if (ast && ast.loc) {
            iidSourceInfo[i] = [curFileName, ast.loc.start.line, ast.loc.start.column + 1, ast.loc.end.line, ast.loc.end.column + 1];
            //writeLineToIIDMap('iids[' + i + '] = [filename,' + (ast.loc.start.line) + "," + (ast.loc.start.column + 1) + "];\n");
        }
//        else {
//            console.log(i+":undefined:undefined");
//        }
    }

    // iid+2 is usually unallocated
    // we are using iid+2 for the sub-getField operation of a method call
    // see analysis.M
    function printSpecialIidToLoc(ast0) {
        printLineInfoAux(iid + 2, ast0);
    }

    function printIidToLoc(ast0) {
        printLineInfoAux(iid, ast0);
    }

    function printOpIidToLoc(ast0) {
        printLineInfoAux(opIid, ast0);
    }

    function printCondIidToLoc(ast0) {
        printLineInfoAux(condCount, ast0);
    }

// J$_i in expression context will replace it by an AST
// {J$_i} will replace the body of the block statement with an array of statements passed as argument

    function replaceInStatement(code) {
        var asts = arguments;
        var visitorReplaceInExpr = {
            'Identifier':function (node) {
                if (node.name.indexOf(RP) === 0) {
                    var i = parseInt(node.name.substring(RP.length));
                    return asts[i];
                } else {
                    return node;
                }
            },
            'BlockStatement':function (node) {
                if (node.body[0].type === 'ExpressionStatement' && isArr(node.body[0].expression)) {
                    node.body = node.body[0].expression;
                }
                return node;
            }
        };
//        StatCollector.resumeTimer("internalParse");
        var ast = acorn.parse(code);
//        StatCollector.suspendTimer("internalParse");
//        StatCollector.resumeTimer("replace");
        var newAst = astUtil.transformAst(ast, visitorReplaceInExpr, undefined, undefined, true);
        //console.log(newAst);
//        StatCollector.suspendTimer("replace");
        return newAst.body;
    }

    function replaceInExpr(code) {
        var ret = replaceInStatement.apply(this, arguments);
        return ret[0].expression;
    }

    function createLiteralAst(name) {
        return {type:Syntax.Literal, value:name};
    }

    function createIdentifierAst(name) {
        return {type:Syntax.Identifier, name:name};
    }

    function transferLoc(newNode, oldNode) {
        if (oldNode.loc)
            newNode.loc = oldNode.loc;
        if (oldNode.raw)
            newNode.raw = oldNode.loc;
    }

    function wrapPutField(node, base, offset, rvalue) {
        if (!Config.INSTR_PUTFIELD || Config.INSTR_PUTFIELD(node.computed ? null : offset.value, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                    logPutFieldFunName +
                    "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4)",
                getIid(),
                base,
                offset,
                rvalue
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapModAssign(node, base, offset, op, rvalue) {
        if (!Config.INSTR_PROPERTY_BINARY_ASSIGNMENT || Config.INSTR_PROPERTY_BINARY_ASSIGNMENT(op, node.computed ? null : offset.value, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                    logAssignFunName + "(" + RP + "1," + RP + "2," + RP + "3," + RP + "4)(" + RP + "5)",
                getIid(),
                base,
                offset,
                createLiteralAst(op),
                rvalue
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapMethodCall(node, base, offset, isCtor) {
        printIidToLoc(node);
        printSpecialIidToLoc(node.callee);
        var ret = replaceInExpr(
            logMethodCallFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + (isCtor ? "true" : "false") + ")",
            getIid(),
            base,
            offset
        );
        transferLoc(ret, node.callee);
        return ret;
    }

    function wrapFunCall(node, ast, isCtor) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logFunCallFunName + "(" + RP + "1, " + RP + "2, " + (isCtor ? "true" : "false") + ")",
            getIid(),
            ast
        );
        transferLoc(ret, node.callee);
        return ret;
    }

    function wrapGetField(node, base, offset) {
        if (!Config.INSTR_GETFIELD || Config.INSTR_GETFIELD(node.computed ? null : offset.value, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                    logGetFieldFunName + "(" + RP + "1, " + RP + "2, " + RP + "3)",
                getIid(),
                base,
                offset
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapRead(node, name, val, isReUseIid, isGlobal, isPseudoGlobal) {
        if (!Config.INSTR_READ || Config.INSTR_READ(name, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                    logReadFunName + "(" + RP + "1, " + RP + "2, " + RP + "3," + (isGlobal ? "true" : "false") + "," + (isPseudoGlobal ? "true" : "false") + ")",
                isReUseIid ? getPrevIidNoInc() : getIid(),
                name,
                val
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return val;
        }
    }

//    function wrapReadWithUndefinedCheck(node, name) {
//        var ret = replaceInExpr(
//            "("+logIFunName+"(typeof ("+name+") === 'undefined'? "+RP+"2 : "+RP+"3))",
//            createIdentifierAst(name),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst("undefined")),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst(name), true)
//        );
//        transferLoc(ret, node);
//        return ret;
//    }

    function wrapReadWithUndefinedCheck(node, name) {
        var ret;

        if (name !== 'location') {
            ret = replaceInExpr(
                "(" + logIFunName + "(typeof (" + name + ") === 'undefined'? (" + name + "=" + RP + "2) : (" + name + "=" + RP + "3)))",
                createIdentifierAst(name),
                wrapRead(node, createLiteralAst(name), createIdentifierAst("undefined"), false, true, true),
                wrapRead(node, createLiteralAst(name), createIdentifierAst(name), true, true, true)
            );
        } else {
            ret = replaceInExpr(
                "(" + logIFunName + "(typeof (" + name + ") === 'undefined'? (" + RP + "2) : (" + RP + "3)))",
                createIdentifierAst(name),
                wrapRead(node, createLiteralAst(name), createIdentifierAst("undefined"), false, true, true),
                wrapRead(node, createLiteralAst(name), createIdentifierAst(name), true, true, true)
            );
        }
        transferLoc(ret, node);
        return ret;
    }

    function wrapWrite(node, name, val, lhs, isGlobal, isPseudoGlobal) {
        if (!Config.INSTR_WRITE || Config.INSTR_WRITE(name, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                    logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4," + (isGlobal ? "true" : "false") + "," + (isPseudoGlobal ? "true" : "false") + ")",
                getIid(),
                name,
                val,
                lhs
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapWriteWithUndefinedCheck(node, name, val, lhs) {
        if (!Config.INSTR_WRITE || Config.INSTR_WRITE(name, node)) {
            printIidToLoc(node);
//        var ret2 = replaceInExpr(
//            "("+logIFunName+"(typeof ("+name+") === 'undefined'? "+RP+"2 : "+RP+"3))",
//            createIdentifierAst(name),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst("undefined")),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst(name), true)
//        );
            var ret = replaceInExpr(
                    logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + logIFunName + "(typeof(" + lhs.name + ")==='undefined'?undefined:" + lhs.name + "), true, true)",
                getIid(),
                name,
                val
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapRHSOfModStore(node, left, right, op) {
        var ret = replaceInExpr(RP + "1 " + op + " " + RP + "2",
            left, right);
        transferLoc(ret, node);
        return ret;
    }

    function makeNumber(node, left) {
        var ret = replaceInExpr(" + " + RP + "1 ", left);
        transferLoc(ret, node);
        return ret;
    }

    function wrapLHSOfModStore(node, left, right) {
        var ret = replaceInExpr(RP + "1 = " + RP + "2",
            left, right);
        transferLoc(ret, node);
        return ret;
    }

    function ifObjectExpressionHasGetterSetter(node) {
        if (node.type === "ObjectExpression") {
            var kind, len = node.properties.length;
            for (var i = 0; i < len; i++) {
                if ((kind = node.properties[i].kind) === 'get' || kind === 'set') {
                    return true;
                }
            }
        }
        return false;
    }

    var dummyFun = function () {
    };
    var dummyObject = {};
    var dummyArray = [];

    function getLiteralValue(funId, node) {
        if (node.name === "undefined") {
            return undefined;
        } else if (node.name === "NaN") {
            return NaN;
        } else if (node.name === "Infinity") {
            return Infinity;
        }
        switch (funId) {
            case N_LOG_NUMBER_LIT:
            case N_LOG_STRING_LIT:
            case N_LOG_NULL_LIT:
            case N_LOG_REGEXP_LIT:
            case N_LOG_BOOLEAN_LIT:
                return node.value;
            case N_LOG_ARRAY_LIT:
                return dummyArray;
            case N_LOG_FUNCTION_LIT:
                return dummyFun;
            case N_LOG_OBJECT_LIT:
                return dummyObject;
        }
        throw new Error(funId + " not known");
    }

    function wrapLiteral(node, ast, funId) {
        if (!Config.INSTR_LITERAL || Config.INSTR_LITERAL(getLiteralValue(funId, node), node)) {
            printIidToLoc(node);
            var hasGetterSetter = ifObjectExpressionHasGetterSetter(node);
            var ret = replaceInExpr(
                    logLitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3," + hasGetterSetter + ")",
                getIid(),
                ast,
                createLiteralAst(funId)
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapReturn(node, expr) {
        var lid = (expr === null) ? node : expr;
        printIidToLoc(lid);
        if (expr === null) {
            expr = createIdentifierAst("undefined");
        }
        var ret = replaceInExpr(
            logReturnFunName + "(" + RP + "1, " + RP + "2)",
            getIid(),
            expr
        );
        transferLoc(ret, lid);
        return ret;
    }

    function wrapHash(node, ast) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logHashFunName + "(" + RP + "1, " + RP + "2)",
            getIid(),
            ast
        );
        transferLoc(ret, node);
        return ret;
    }

    function wrapEvalArg(ast) {
        printIidToLoc(ast);
        var ret = replaceInExpr(
            instrumentCodeFunName + "(" + astUtil.JALANGI_VAR + ".getConcrete(" + RP + "1), {wrapProgram: false, isEval: true}," + RP + "2).code",
            ast,
            getIid()
        );
        transferLoc(ret, ast);
        return ret;
    }

    function wrapUnaryOp(node, argument, operator) {
        if (!Config.INSTR_UNARY || Config.INSTR_UNARY(operator, node)) {
            printOpIidToLoc(node);
            var ret = replaceInExpr(
                    logUnaryOpFunName + "(" + RP + "1," + RP + "2," + RP + "3)",
                getOpIid(),
                createLiteralAst(operator),
                argument
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapBinaryOp(node, left, right, operator) {
        if (!Config.INSTR_BINARY || Config.INSTR_BINARY(operator, operator)) {
            printOpIidToLoc(node);
            var ret = replaceInExpr(
                    logBinaryOpFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4)",
                getOpIid(),
                createLiteralAst(operator),
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapLogicalAnd(node, left, right) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("&&", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                    logConditionalFunName + "(" + RP + "1, " + RP + "2)?" + RP + "3:" + logLastFunName + "()",
                getCondIid(),
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapLogicalOr(node, left, right) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("||", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                    logConditionalFunName + "(" + RP + "1, " + RP + "2)?" + logLastFunName + "():" + RP + "3",
                getCondIid(),
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapSwitchDiscriminant(node, discriminant) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("switch", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                    logSwitchLeftFunName + "(" + RP + "1, " + RP + "2)",
                getCondIid(),
                discriminant
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapSwitchTest(node, test) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("switch", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                    logSwitchRightFunName + "(" + RP + "1, " + RP + "2)",
                getCondIid(),
                test
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }
    }

    function wrapConditional(node, test) {
        if (node === null) {
            return node;
        } // to handle for(;;) ;

        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("other", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                    logConditionalFunName + "(" + RP + "1, " + RP + "2)",
                getCondIid(),
                test
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return node;
        }

    }

//    function createCallWriteAsStatement(node, name, val) {
//        printIidToLoc(node);
//        var ret = replaceInStatement(
//            logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3)",
//            getIid(),
//            name,
//            val
//        );
//        transferLoc(ret[0].expression, node);
//        return ret;
//    }

    function createCallInitAsStatement(node, name, val, isArgumentSync, lhs, isCatchParam) {
        printIidToLoc(node);
        var ret;

        if (isArgumentSync)
            ret = replaceInStatement(
                RP + "1 = " + logInitFunName + "(" + RP + "2, " + RP + "3, " + RP + "4, " + isArgumentSync + ", false,"+isCatchParam+")",
                lhs,
                getIid(),
                name,
                val
            );
        else
            ret = replaceInStatement(
                logInitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + isArgumentSync + ", false,"+isCatchParam+")",
                getIid(),
                name,
                val
            );

        transferLoc(ret[0].expression, node);
        return ret;
    }

    function createCallAsFunEnterStatement(node) {
        printIidToLoc(node);
        var ret = replaceInStatement(
            logFunctionEnterFunName + "(" + RP + "1,arguments.callee, this, arguments)",
            getIid()
        );
        transferLoc(ret[0].expression, node);
        return ret;
    }

    function createCallAsScriptEnterStatement(node, instrumentedFileName) {
        printIidToLoc(node);
        var ret = replaceInStatement(logScriptEntryFunName + "(" + RP + "1," + RP + "2)",
            getIid(),
            createLiteralAst(instrumentedFileName));
        transferLoc(ret[0].expression, node);
        return ret;
    }

    var labelCounter = 0;

    function wrapForInBody(node, body, name) {
        printIidToLoc(node);
        var ret = replaceInStatement(
            "function n() { " + logInitFunName + "(" + RP + "1, '" + name + "'," + name + ",false, true, false);\n {" + RP + "2}}", getIid(), [body]);

        ret = ret[0].body;
        transferLoc(ret, node);
        return ret;
    }

    function wrapCatchClause(node, body, name) {
        var ret;
        body.unshift(createCallInitAsStatement(node,
            createLiteralAst(name),
            createIdentifierAst(name),
            false, undefined, true)[0]);
    }

    function wrapScriptBodyWithTryCatch(node, body) {
        printIidToLoc(node);
        var iid1 = getIid();
        printIidToLoc(node);
        var l = labelCounter++;
        var ret = replaceInStatement(
            "function n() { jalangiLabel" + l + ": while(true) { try {" + RP + "1} catch(" + astUtil.JALANGI_VAR +
                "e) { //console.log(" + astUtil.JALANGI_VAR + "e); console.log(" +
                astUtil.JALANGI_VAR + "e.stack);\n  " + logUncaughtExceptionFunName + "(" + RP + "2," + astUtil.JALANGI_VAR +
                "e); } finally { if (" + logScriptExitFunName + "(" +
                RP + "3)) continue jalangiLabel" + l + ";\n else \n  break jalangiLabel" + l + ";\n }\n }}", body,
            iid1,
            getIid()
        );
        //console.log(JSON.stringify(ret));

        ret = ret[0].body.body;
        transferLoc(ret[0], node);
        return ret;
    }

    function wrapFunBodyWithTryCatch(node, body) {
        printIidToLoc(node);
        var iid1 = getIid();
        printIidToLoc(node);
        var l = labelCounter++;
        var ret = replaceInStatement(
            "function n() { jalangiLabel" + l + ": while(true) { try {" + RP + "1} catch(" + astUtil.JALANGI_VAR +
                "e) { //console.log(" + astUtil.JALANGI_VAR + "e); console.log(" +
                astUtil.JALANGI_VAR + "e.stack);\n " + logUncaughtExceptionFunName + "(" + RP + "2," + astUtil.JALANGI_VAR +
                "e); } finally { if (" + logFunctionReturnFunName + "(" +
                RP + "3)) continue jalangiLabel" + l + ";\n else \n  return " + logReturnAggrFunName + "();\n }\n }}", body,
            iid1,
            getIid()
        );
        //console.log(JSON.stringify(ret));

        ret = ret[0].body.body;
        transferLoc(ret[0], node);
        return ret;
    }

    function syncDefuns(node, scope, isScript) {
        var ret = [], ident;
        if (!isScript) {
            ident = createIdentifierAst("arguments");
            ret = ret.concat(createCallInitAsStatement(node,
                createLiteralAst("arguments"),
                ident,
                true,
                ident, false));
        }
        if (scope) {
            for (var name in scope.vars) {
                if (HOP(scope.vars, name)) {
                    if (scope.vars[name] === "defun") {
                        ident = createIdentifierAst(name);
                        ident.loc = scope.funLocs[name];
                        ret = ret.concat(createCallInitAsStatement(node,
                            createLiteralAst(name),
                            wrapLiteral(ident, ident, N_LOG_FUNCTION_LIT),
                            true,
                            ident, false));
                    }
                    if (scope.vars[name] === "arg") {
                        ident = createIdentifierAst(name);
                        ret = ret.concat(createCallInitAsStatement(node,
                            createLiteralAst(name),
                            ident,
                            true,
                            ident, false));
                    }
                    if (scope.vars[name] === "var") {
                        ret = ret.concat(createCallInitAsStatement(node,
                            createLiteralAst(name),
                            createIdentifierAst(name),
                            false, undefined, false));
                    }
                }
            }
        }
        return ret;
    }


    var scope;


    function instrumentFunctionEntryExit(node, ast) {
        var body = createCallAsFunEnterStatement(node).
            concat(syncDefuns(node, scope, false)).concat(ast);
        return body;
    }

//    function instrumentFunctionEntryExit(node, ast) {
//        return wrapFunBodyWithTryCatch(node, ast);
//    }

    /**
     * instruments entry of a script.  Adds the script entry (J$.Se) callback,
     * and the J$.N init callbacks for locals.
     *
     */
    function instrumentScriptEntryExit(node, body0) {
        var modFile = (typeof instCodeFileName === "string") ?
            instCodeFileName :
            "internal";
        var body = createCallAsScriptEnterStatement(node, modFile).
            concat(syncDefuns(node, scope, true)).
            concat(body0);
        return body;
    }


    function getPropertyAsAst(ast) {
        return ast.computed ? ast.property : createLiteralAst(ast.property.name);
    }

    function instrumentCall(callAst, isCtor) {
        var ast = callAst.callee;
        var ret;
        if (ast.type === 'MemberExpression') {
            ret = wrapMethodCall(callAst, ast.object,
                getPropertyAsAst(ast),
                isCtor);
            return ret;
        } else if (ast.type === 'Identifier' && ast.name === "eval") {
            return ast;
        } else {
            ret = wrapFunCall(callAst, ast, isCtor);
            return ret;
        }
    }

    function instrumentStore(node) {
        var ret;
        if (node.left.type === 'Identifier') {
            if (scope.hasVar(node.left.name)) {
                ret = wrapWrite(node.right, createLiteralAst(node.left.name), node.right, node.left, false, scope.isGlobal(node.left.name));
            } else {
                ret = wrapWriteWithUndefinedCheck(node.right, createLiteralAst(node.left.name), node.right, node.left);

            }
            node.right = ret;
            return node;
        } else {
            ret = wrapPutField(node, node.left.object, getPropertyAsAst(node.left), node.right);
            return ret;
        }
    }

    function instrumentLoad(ast) {
        var ret;
        if (ast.type === 'Identifier') {
            if (ast.name === "undefined") {
                ret = wrapLiteral(ast, ast, N_LOG_UNDEFINED_LIT);
                return ret;
            } else if (ast.name === "NaN" || ast.name === "Infinity") {
                ret = wrapLiteral(ast, ast, N_LOG_NUMBER_LIT);
                return ret;
            }
            if (ast.name === astUtil.JALANGI_VAR) {
                return ast;
            } else if (scope.hasVar(ast.name)) {
                ret = wrapRead(ast, createLiteralAst(ast.name), ast, false, false, scope.isGlobal(ast.name));
                return ret;
            } else {
                ret = wrapReadWithUndefinedCheck(ast, ast.name);
                return ret;
            }
        } else if (ast.type === 'MemberExpression') {
            return wrapGetField(ast, ast.object, getPropertyAsAst(ast));
        } else {
            return ast;
        }
    }

    function instrumentLoadModStore(node, isNumber) {
        if (node.left.type === 'Identifier') {
            var tmp0 = instrumentLoad(node.left);
            if (isNumber) {
                tmp0 = makeNumber(node, instrumentLoad(tmp0));
            }
            var tmp1 = wrapRHSOfModStore(node.right, tmp0, node.right, node.operator.substring(0, node.operator.length - 1));

            var tmp2;
            if (scope.hasVar(node.left.name)) {
                tmp2 = wrapWrite(node.right, createLiteralAst(node.left.name), tmp1, node.left, false, scope.isGlobal(node.left.name));
            } else {
                tmp2 = wrapWriteWithUndefinedCheck(node.right, createLiteralAst(node.left.name), tmp1, node.left);

            }
            tmp2 = wrapLHSOfModStore(node, node.left, tmp2);
            return tmp2;
        } else {
            var ret = wrapModAssign(node, node.left.object,
                getPropertyAsAst(node.left),
                node.operator.substring(0, node.operator.length - 1),
                node.right);
            return ret;
        }
    }

    function instrumentPreIncDec(node) {
        var right = createLiteralAst(1);
        var ret = wrapRHSOfModStore(node, node.argument, right, node.operator.substring(0, 1) + "=");
        return instrumentLoadModStore(ret, true);
    }

    function adjustIncDec(op, ast) {
        if (op === '++') {
            op = '-';
        } else {
            op = '+';
        }
        var right = createLiteralAst(1);
        var ret = wrapRHSOfModStore(ast, ast, right, op);
        return ret;
    }


    // Should 'Program' nodes in the AST be wrapped with prefix code to load libraries,
    // code to indicate script entry and exit, etc.?
    // we need this flag since when we're instrumenting eval'd code, the code is parsed
    // as a top-level 'Program', but the wrapping code may not be syntactically valid in 
    // the surrounding context, e.g.:
    //    var y = eval("x + 1");
    var wrapProgramNode = true;

    function setScope(node) {
        scope = node.scope;
    }

    var visitorRRPre = {
        'Program':setScope,
        'FunctionDeclaration':setScope,
        'FunctionExpression':setScope,
        'CatchClause':setScope
    };

    var visitorRRPost = {
        'Literal':function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {

                var litType;
                switch (typeof node.value) {
                    case 'number':
                        litType = N_LOG_NUMBER_LIT;
                        break;
                    case 'string':
                        litType = N_LOG_STRING_LIT;
                        break;
                    case 'object': // for null
                        if (node.value === null)
                            litType = N_LOG_NULL_LIT;
                        else
                            litType = N_LOG_REGEXP_LIT;
                        break;
                    case 'boolean':
                        litType = N_LOG_BOOLEAN_LIT;
                        break;
                }
                var ret1 = wrapLiteral(node, node, litType);
                return ret1;
            } else {
                return node;
            }
        },
        "Program":function (node) {
            if (wrapProgramNode) {
                var ret = instrumentScriptEntryExit(node, node.body);
                node.body = ret;

            }
            scope = scope.parent;
            return node;
        },
        "VariableDeclaration":function (node) {
            var declarations = MAP(node.declarations, function (def) {
                if (def.init !== null) {
                    var init = wrapWrite(def.init, createLiteralAst(def.id.name), def.init, def.id, false, scope.isGlobal(def.id.name));
                    def.init = init;
                }
                return def;
            });
            node.declarations = declarations;
            return node;
        },
        "NewExpression":function (node) {
            var ret = {
                type:'CallExpression',
                callee:instrumentCall(node, true),
                'arguments':node.arguments
            };
            transferLoc(ret, node);
            return ret;
//            var ret1 = wrapLiteral(node, ret, N_LOG_OBJECT_LIT);
//            return ret1;
        },
        "CallExpression":function (node) {
            var isEval = node.callee.type === 'Identifier' && node.callee.name === "eval";
            var callee = instrumentCall(node, false);
            node.callee = callee;
            if (isEval) {
                node.arguments = MAP(node.arguments, wrapEvalArg);
            }
            return node;
        },
        "AssignmentExpression":function (node) {
            var ret1;
            if (node.operator === "=") {
                ret1 = instrumentStore(node);
            } else {
                ret1 = instrumentLoadModStore(node);
            }
            return ret1;
        },
        "UpdateExpression":function (node) {
            var ret1;
            ret1 = instrumentPreIncDec(node);
            if (!node.prefix) {
                ret1 = adjustIncDec(node.operator, ret1);
            }
            return ret1;
        },
        "FunctionExpression":function (node, context) {
            node.body.body = instrumentFunctionEntryExit(node, node.body.body);
            var ret1;
            if (context === astUtil.CONTEXT.GETTER || context === astUtil.CONTEXT.SETTER) {
                ret1 = node;
            } else {
                ret1 = wrapLiteral(node, node, N_LOG_FUNCTION_LIT);
            }
            scope = scope.parent;
            return ret1;
        },
        "FunctionDeclaration":function (node) {
            //console.log(node.body.body);
            node.body.body = instrumentFunctionEntryExit(node, node.body.body);
            scope = scope.parent;
            return node;
        },
        "ObjectExpression":function (node) {
            var ret1 = wrapLiteral(node, node, N_LOG_OBJECT_LIT);
            return ret1;
        },
        "ArrayExpression":function (node) {
            var ret1 = wrapLiteral(node, node, N_LOG_ARRAY_LIT);
            return ret1;
        },
        'ThisExpression':function (node) {
            var ret = wrapRead(node, createLiteralAst('this'), node);
            return ret;
        },
        'Identifier':function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {
                var ret = instrumentLoad(node);
                return ret;
            } else {
                return node;
            }
        },
        'MemberExpression':function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {
                var ret = instrumentLoad(node);
                return ret;
            } else {
                return node;
            }
        },
        "ForInStatement":function (node) {
            var ret = wrapHash(node.right, node.right);
            node.right = ret;
            var name;
            if (node.left.type === 'VariableDeclaration') {
                name = node.left.declarations[0].id.name;
            } else {
                name = node.left.name;
            }
            node.body = wrapForInBody(node, node.body, name);
            return node;
        },
        "CatchClause":function (node) {
            var name;
            name = node.param.name;
            wrapCatchClause(node, node.body.body, name);
            scope = scope.parent;
            return node;
        },
        "ReturnStatement":function (node) {
            var ret = wrapReturn(node, node.argument);
            node.argument = ret;
            return node;
        }
    };

    function funCond(node) {
        var ret = wrapConditional(node.test, node.test);
        node.test = ret;
        return node;
    }


    var visitorOps = {
        "Program":function (node) {
            if (wrapProgramNode) {
                var body = wrapScriptBodyWithTryCatch(node, node.body);
//                var ret = prependScriptBody(node, body);
                node.body = body;

            }
            return node;
        },
        'BinaryExpression':function (node) {
            var ret = wrapBinaryOp(node, node.left, node.right, node.operator);
            return ret;
        },
        'LogicalExpression':function (node) {
            var ret;
            if (node.operator === "&&") {
                ret = wrapLogicalAnd(node, node.left, node.right);
            } else if (node.operator === "||") {
                ret = wrapLogicalOr(node, node.left, node.right);
            }
            return ret;
        },
        'UnaryExpression':function (node) {
            var ret;
            if (node.operator === "void") {
                return node;
            } else if (node.operator === "delete") {
                if (node.argument.object) {
                    ret = wrapBinaryOp(node, node.argument.object, getPropertyAsAst(node.argument), node.operator);
                } else {
                    return node;
                }
            } else {
                ret = wrapUnaryOp(node, node.argument, node.operator);
            }
            return ret;
        },
        "SwitchStatement":function (node) {
            var dis = wrapSwitchDiscriminant(node.discriminant, node.discriminant);
            var cases = MAP(node.cases, function (acase) {
                var test;
                if (acase.test) {
                    test = wrapSwitchTest(acase.test, acase.test);
                    acase.test = test;
                }
                return acase;
            });
            node.discriminant = dis;
            node.cases = cases;
            return node;
        },
        "FunctionExpression":function (node) {
            node.body.body = wrapFunBodyWithTryCatch(node, node.body.body);
            return node;
        },
        "FunctionDeclaration":function (node) {
            node.body.body = wrapFunBodyWithTryCatch(node, node.body.body);
            return node;
        },
        "ConditionalExpression":funCond,
        "IfStatement":funCond,
        "WhileStatement":funCond,
        "DoWhileStatement":funCond,
        "ForStatement":funCond
    };

    function addScopes(ast) {

        function Scope(parent, isCatch) {
            this.vars = {};
            this.funLocs = {};
            this.hasEval = false;
            this.hasArguments = false;
            this.parent = parent;
            this.isCatch = isCatch;
        }

        Scope.prototype.addVar = function (name, type, loc) {
            var tmpScope = this;
            if (this.isCatch && type!== 'catch') {
                tmpScope = this.parent;
            }

            if (tmpScope.vars[name] !== 'arg') {
                tmpScope.vars[name] = type;
            }
            if (type === 'defun') {
                tmpScope.funLocs[name] = loc;
            }
        };

        Scope.prototype.hasOwnVar = function (name) {
            var s = this;
            if (s && HOP(s.vars, name))
                return s.vars[name];
            return null;
        };

        Scope.prototype.hasVar = function (name) {
            var s = this;
            while (s !== null) {
                if (HOP(s.vars, name))
                    return s.vars[name];
                s = s.parent;
            }
            return null;
        };

        Scope.prototype.isGlobal = function (name) {
            var s = this;
            while (s !== null) {
                if (HOP(s.vars, name) && s.parent !== null) {
                    return false;
                }
                s = s.parent;
            }
            return true;
        };

        Scope.prototype.addEval = function () {
            var s = this;
            while (s !== null) {
                s.hasEval = true;
                s = s.parent;
            }
        };

        Scope.prototype.addArguments = function () {
            var s = this;
            while (s !== null) {
                s.hasArguments = true;
                s = s.parent;
            }
        };

        Scope.prototype.usesEval = function () {
            return this.hasEval;
        };

        Scope.prototype.usesArguments = function () {
            return this.hasArguments;
        };


        var currentScope = null;

        // rename arguments to J$_arguments
        var fromName = 'arguments';
        var toName = astUtil.JALANGI_VAR + "_arguments";

        function handleFun(node) {
            var oldScope = currentScope;
            currentScope = new Scope(currentScope);
            node.scope = currentScope;
            if (node.type === 'FunctionDeclaration') {
                oldScope.addVar(node.id.name, "defun", node.loc);
                MAP(node.params, function (param) {
                    if (param.name === fromName) {         // rename arguments to J$_arguments
                        param.name = toName;
                    }
                    currentScope.addVar(param.name, "arg");
                });
            } else if (node.type === 'FunctionExpression') {
                if (node.id !== null) {
                    currentScope.addVar(node.id.name, "lambda");
                }
                MAP(node.params, function (param) {
                    if (param.name === fromName) {         // rename arguments to J$_arguments
                        param.name = toName;
                    }
                    currentScope.addVar(param.name, "arg");
                });
            }
        }

        function handleVar(node) {
            currentScope.addVar(node.id.name, "var");
        }

        function handleCatch(node) {
            var oldScope = currentScope;
            currentScope = new Scope(currentScope, true);
            node.scope = currentScope;
            currentScope.addVar(node.param.name, "catch");
        }

        function popScope(node) {
            currentScope = currentScope.parent;
            return node;
        }

        var visitorPre = {
            'Program':handleFun,
            'FunctionDeclaration':handleFun,
            'FunctionExpression':handleFun,
            'VariableDeclarator':handleVar,
            'CatchClause':handleCatch
        };

        var visitorPost = {
            'Program':popScope,
            'FunctionDeclaration':popScope,
            'FunctionExpression':popScope,
            'CatchClause':popScope,
            'Identifier':function (node, context) {         // rename arguments to J$_arguments
                if (context === astUtil.CONTEXT.RHS && node.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.name = toName;
                }
                return node;
            },
            "UpdateExpression":function (node) {         // rename arguments to J$_arguments
                if (node.argument.type === 'Identifier' && node.argument.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.argument.name = toName;
                }
                return node;
            },
            "AssignmentExpression":function (node) {         // rename arguments to J$_arguments
                if (node.left.type === 'Identifier' && node.left.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.left.name = toName;
                }
                return node;
            }

        };
        astUtil.transformAst(ast, visitorPost, visitorPre);
    }


    // START of Liang Gong's AST post-processor
    function hoistFunctionDeclaration(ast, hoisteredFunctions) {
        var key, child, startIndex = 0;
        if (ast.body) {
            var newBody = [];
            if (ast.body.length > 0) { // do not hoister function declaration before J$.Fe or J$.Se
                if (ast.body[0].type === 'ExpressionStatement') {
                    if (ast.body[0].expression.type === 'CallExpression') {
                        if (ast.body[0].expression.callee.object &&
                            ast.body[0].expression.callee.object.name === 'J$'
                            && ast.body[0].expression.callee.property
                            &&
                            (ast.body[0].expression.callee.property.name === 'Se' || ast.body[0].
                                expression.callee.property.name === 'Fe')) {

                            newBody.push(ast.body[0]);
                            startIndex = 1;
                        }
                    }
                }
            }
            for (var i = startIndex; i < ast.body.length; i++) {

                if (ast.body[i].type === 'FunctionDeclaration') {
                    newBody.push(ast.body[i]);
                    if (newBody.length !== i + 1) {
                        hoisteredFunctions.push(ast.body[i].id.name);
                    }
                }
            }
            for (var i = startIndex; i < ast.body.length; i++) {
                if (ast.body[i].type !== 'FunctionDeclaration') {
                    newBody.push(ast.body[i]);
                }
            }
            while (ast.body.length > 0) {
                ast.body.pop();
            }
            for (var i = 0; i < newBody.length; i++) {
                ast.body.push(newBody[i]);
            }
        } else {
            //console.log(typeof ast.body);
        }
        for (key in ast) {
            if (ast.hasOwnProperty(key)) {
                child = ast[key];
                if (typeof child === 'object' && child !== null && key !==
                    "scope") {
                    hoistFunctionDeclaration(child, hoisteredFunctions);
                }

            }
        }

        return ast;
    }

    // END of Liang Gong's AST post-processor

    function transformString(code, visitorsPost, visitorsPre) {
//         StatCollector.resumeTimer("parse");
//        console.time("parse")
//        var newAst = esprima.parse(code, {loc:true, range:true});
        var newAst = acorn.parse(code, { locations:true });
//        console.timeEnd("parse")
//        StatCollector.suspendTimer("parse");
//        StatCollector.resumeTimer("transform");
//        console.time("transform")
        addScopes(newAst);
        var len = visitorsPost.length;
        for (var i = 0; i < len; i++) {
            newAst = astUtil.transformAst(newAst, visitorsPost[i], visitorsPre[i], astUtil.CONTEXT.RHS);
        }
//        console.timeEnd("transform")
//        StatCollector.suspendTimer("transform");
//        console.log(JSON.stringify(newAst,null,"  "));
        return newAst;
    }

    // if this string is discovered inside code passed to instrumentCode(),
    // the code will not be instrumented
    var noInstr = "// JALANGI DO NOT INSTRUMENT";

    function makeInstCodeFileName(name) {
        return name.replace(/.js$/, FILESUFFIX1 + ".js");
    }

    /**
     * Instruments the provided code.
     *
     * @param {string} code The code to instrument
     * @param {{wrapProgram: boolean, isEval: boolean }} options
     *    Options for code generation:
     *      'wrapProgram': Should the instrumented code be wrapped with prefix code to load libraries,
     * code to indicate script entry and exit, etc.? should be false for code being eval'd
     *      'isEval': is the code being instrumented for an eval?
     * @return {{code:string, instAST: object}} an object whose 'code' property is the instrumented code string,
     * and whose 'instAST' property is the AST for the instrumented code
     *
     */
    function instrumentCode(code, options, iid) {
        var tryCatchAtTop = options.wrapProgram,
            isEval = options.isEval,
            instCodeCallback = isEval && sandbox.analysis && sandbox.analysis.instrumentCode;
        if (typeof  code === "string") {
            if (iid && sandbox.analysis && sandbox.analysis.instrumentCodePre) {
                code = sandbox.analysis.instrumentCodePre(iid, code);
            }
            if (code.indexOf(noInstr) < 0 && !(isEval && sandbox.noInstrEval)) {
                // this is a call in eval
                initializeIIDCounters(isEval);
                wrapProgramNode = tryCatchAtTop;
                var newAst = transformString(code, [visitorRRPost, visitorOps], [visitorRRPre, undefined]);
                // post-process AST to hoist function declarations (required for Firefox)
                var hoistedFcts = [];
                newAst = hoistFunctionDeclaration(newAst, hoistedFcts);
//                StatCollector.resumeTimer("generate");
//                console.time("generate")
                var newCode = escodegen.generate(newAst);
//                console.timeEnd("generate")
//                StatCollector.suspendTimer("generate");


                var ret = newCode + "\n" + noInstr + "\n";
                if (instCodeCallback) {
                    sandbox.analysis.instrumentCode(iid || -1, newAst);
                }
                return { code: ret, instAST: newAst, iidSourceInfo: iidSourceInfo };
            } else {
                return {code:code };
            }
        } else {
            return {code:code};
        }
    }

    function instrumentAux(code, args) {
        orig2Inst = {};
        iidSourceInfo = {};
        if (!args.dirIIDFile) {
            throw new Error("must provide dirIIDFile");
        }
        curFileName = args.filename;
        instCodeFileName = args.instFileName;
        if (curFileName && instCodeFileName) {
            orig2Inst[curFileName] = instCodeFileName;
        }

        loadInitialIID(args.dirIIDFile, args.initIID);

        var wrapProgram = HOP(args, 'wrapProgram') ? args.wrapProgram : true;
        var codeAndMData = instrumentCode(code, {wrapProgram:wrapProgram, isEval:false });

        storeInitialIID(args.dirIIDFile);
        writeIIDMapFile(args.dirIIDFile, args.initIID, args.inlineIID);
        return codeAndMData;
    }

    function instrumentFile() {
        var argparse = require('argparse');
        var parser = new argparse.ArgumentParser({
            addHelp:true,
            description:"Command-line utility to perform instrumentation"
        });
        parser.addArgument(['--initIID'], { help:"Initialize IIDs to 0", action:'storeTrue'});
        parser.addArgument(['--noInstrEval'], { help:"Do not instrument strings passed to evals", action:'storeTrue'});
        parser.addArgument(['--inlineIID'], { help:"Inline IIDs in the instrumented file", action:'storeTrue'});
        parser.addArgument(['--dirIIDFile'], { help:"Directory containing " + SMAP_FILE_NAME + " and " + INITIAL_IID_FILE_NAME, defaultValue:process.cwd() });
        parser.addArgument(['--out'], { help:"Instrumented file name (with path).  The default is to append _jalangi_ to the original JS file name", defaultValue:undefined });
        parser.addArgument(['file'], {
            help:"file to instrument",
            nargs:1
        });
        var args = parser.parseArgs();

        if (args.file.length === 0) {
            console.error("must provide file to instrument");
            process.exit(1);
        }

        var fname = args.file[0];
        args.filename = sanitizePath(require('path').resolve(process.cwd(), fname));
        args.instFileName = args.out ? args.out : makeInstCodeFileName(fname);

        var codeAndMData = instrumentAux(getCode(fname), args);
//        console.time("save")
        saveCode(codeAndMData.code, args.inlineIID, args.noInstrEval);
//        StatCollector.printStats();
//        console.timeEnd("save")
    }


    if (typeof exports !== 'undefined' && this.exports !== exports) {
        exports.instrumentCodeDeprecated = instrumentAux;
    }

    if (typeof window === 'undefined' && (typeof require !== "undefined") && require.main === module) {
        instrumentFile();
    } else {
        sandbox.instrumentCode = instrumentCode;
    }
}((typeof J$ === 'undefined') ? J$ = {} : J$));




(function() {

    function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function sizeOfMap(obj) {
        var count = 0;
        for (var i in obj) {
            if (HOP(obj, i)) {
                count++;
            }
        }
        return count;
    }

    function assert(cond, msg) {
        if (!cond)
            throw new Error(msg);
    }

    function shallowClone(s) {
        var r = {};
        for (var p in s) {
            if (HOP(s, p))
                r[p] = s[p];
        }
        return r;
    }

    function mergeToLeft(left, right) {
        var rt = typeof right;
        if (rt === 'boolean' || rt === 'string' || rt === 'number') {
            return right;
        }
        Object.keys(right).forEach(function(rKey) {
            if (HOP(left, rKey)) {
                left[rKey] = mergeToLeft(left[rKey], right[rKey]);
            } else {
                left[rKey] = right[rKey];
            }
        });
        return left;
    }

    function nbOfValues(map) {
        var values = {};
        for (var k in map) {
            if (HOP(map, k)) {
                values[map[k]] = true;
            }
        }
        return Object.keys(values).length;
    }

    function valueArray(map) {
        var values = [];
        for (var k in map) {
            if (HOP(map, k)) {
                var v = map[k];
                if (values.indexOf(v) === -1)
                    values.push(v);
            }
        }
        return values;
    }

    function sameProps(o1, o2) {
        if (Object.keys(o1).length !== Object.keys(o2).length)
            return false;
        for (var p1 in o1) {
            if (HOP(o1, p1) && !HOP(o2, p1))
                return false;
        }
        return true;
    }

    function sameArrays(a1, a2) {
        if (a1.length !== a2.length)
            return false;
        for (var i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i])
                return false;
        }
        return true;
    }

    function stringToHash(str) {
        if (Object.prototype.toString.apply(str) !== "[object String]")
            throw "Should only call for strings, but passed: " + str;
        var hash = 0;
        if (!str)
            return hash;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    function hashInto(oldHash, x) {
        var result = ((oldHash << 5) - oldHash) + x;
        result = result & result;
        return result;
    }

    function intersect(set1, set2) {
        var result = {};
        var keys1 = Object.keys(set1);
        for (var i = 0; i < keys1.length; i++) {
            if (HOP(set2, keys1[i])) {
                result[keys1[i]] = true;
            }
        }
        return result;
    }

    function substractSets(set1, set2) {
        var result = {};
        var keys1 = Object.keys(set1);
        for (var i = 0; i < keys1.length; i++) {
            if (!HOP(set2, keys1[i])) {
                result[keys1[i]] = true;
            }
        }
        return result;
    }

    function arrayToSet(arr) {
        var set = {};
        for (var i = 0; i < arr.length; i++) {
            set[arr[i]] = true;
        }
        return set;
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$CommonUtil = {};
        module = window.$CommonUtil;
    }

    // exports
    module.HOP = HOP;
    module.sizeOfMap = sizeOfMap;
    module.assert = assert;
    module.shallowClone = shallowClone;
    module.mergeToLeft = mergeToLeft;
    module.nbOfValues = nbOfValues;
    module.valueArray = valueArray;
    module.sameProps = sameProps;
    module.sameArrays = sameArrays;
    module.stringToHash = stringToHash;
    module.hashInto = hashInto;
    module.intersect = intersect;
    module.substractSets = substractSets;
    module.arrayToSet = arrayToSet;

})();

(function() {

    var ExtraTypeInfoFlags = {
        NONE:0,
        TO_STRING:2,
        VALUE_OF:2
    }

    function hasToString(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.TO_STRING;
    }

    function hasValueOf(extraTypeInfo) {
        return extraTypeInfo & ExtraTypeInfoFlags.VALUE_OF;
    }

    function createExtraTypeInfo(toString, valueOf) {
        return 0 | (toString ? ExtraTypeInfoFlags.TO_STRING : 0) | (valueOf ? ExtraTypeInfoFlags.VALUE_OF : 0);
    }

    // boilerplate to use this file both in browser and in node application
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in node application
        module = exports;
    } else {
        // export to code running in browser
        window.$CommonUtil = {};
        module = window.$CommonUtil;
    }

    // exports
    module.hasToString = hasToString;
    module.hasValueOf = hasValueOf;
    module.createExtraTypeInfo = createExtraTypeInfo;

})();

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
    function TypeAnalysisEngine3() {

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
        var obsCtr = 0;

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
            }
            return "<ref>";
        }

        function addObservation(obs) {
            if (!util.HOP(hashToObservation, obs.hash)) {
                hashToObservation[obs.hash] = obs;
            }
            var oldFreq = hashToFrequency[obs.hash] || 0;
            hashToFrequency[obs.hash] = oldFreq + 1;

            obsCtr++;
        }

        function isStrict() {
            return !this;
        };

        function hasToString(obj) {
            if (!obj) return false;
            var t = typeof obj;
            if (t === "number" || t === "boolean" || t === "string") return false;
            return obj.toString && obj.toString !== Object.prototype.toString;
        }

        function hasValueOf(obj) {
            if (!obj) return false;
            var t = typeof obj;
            if (t === "number" || t === "boolean" || t === "string") return false;
            return obj.valueOf && obj.valueOf !== Object.prototype.valueOf;
        }

        function extraTypeInfo(v) {
            return constants.createExtraTypeInfo(hasToString(v), hasValueOf(v));
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
            if (op !== "instanceof" && op !== "in") {
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
                hashToFrequency:hashToFrequency
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

    sandbox.analysis = new TypeAnalysisEngine3();
    if (sandbox.Constants.isBrowser) {
        window.addEventListener("beforeunload", function() {
            console.log("beforeunload --> logging results");
            sandbox.analysis.endExecution();
        }, false);
    }

}(J$));

// END OF JALANGI LIBS

(function (sandbox) {
 if (!sandbox.iids) {sandbox.iids = []; sandbox.orig2Inst = {}; }
var iids = sandbox.iids; var orig2Inst = sandbox.orig2Inst;
var fn = "/home/m/research/projects/Jalangi-Berkeley/instrumentFF_tmp/http127.0.0.18000testshtmlunitAppsapp9mini.js";
iids[9] = [fn,1,12,1,39];
iids[17] = [fn,1,12,1,39];
iids[25] = [fn,2,6,2,10];
iids[33] = [fn,2,6,2,10];
iids[41] = [fn,1,1,2,12];
iids[49] = [fn,1,1,2,12];
iids[57] = [fn,1,1,2,12];
iids[65] = [fn,1,1,2,12];
orig2Inst["/home/m/research/projects/Jalangi-Berkeley/instrumentFF_tmp/http127.0.0.18000testshtmlunitAppsapp9mini.js"] = "/home/m/research/projects/Jalangi-Berkeley/instrumentFF_tmp/http127.0.0.18000testshtmlunitAppsapp9mini_jalangi_.js";
}(typeof J$ === 'undefined'? J$ = {}:J$));
J$.noInstrEval = true;
jalangiLabel0:
    while (true) {
        try {
            J$.Se(41, '/home/m/research/projects/Jalangi-Berkeley/instrumentFF_tmp/http127.0.0.18000testshtmlunitAppsapp9mini_jalangi_.js');
            J$.N(49, 'code', code, false, false, false);
            var code = J$.W(17, 'code', J$.T(9, 'console.log(\'eval works\')', 21, false), code, false, true);
            eval(J$.instrumentCode(J$.getConcrete(J$.R(25, 'code', code, false, true)), {
                wrapProgram: false,
                isEval: true
            }, 33).code);
        } catch (J$e) {
            J$.Ex(57, J$e);
        } finally {
            if (J$.Sr(65))
                continue jalangiLabel0;
            else
                break jalangiLabel0;
        }
    }
// JALANGI DO NOT INSTRUMENT



