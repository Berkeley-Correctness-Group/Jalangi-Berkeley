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

// Author: Liang Gong

((function (sandbox){
    var Constants = sandbox.Constants;
    var iidToLocation = sandbox.iidToLocation;
    var HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;
    var HAS_OWN_PROPERTY_CALL = Object.prototype.hasOwnProperty.call;
    var ARRAY_CONSTRUCTOR = Array;
    var HOP = function (obj, prop) {
        return (prop + "" === '__proto__') || HAS_OWN_PROPERTY_CALL.apply(HAS_OWN_PROPERTY, [obj, prop]);
    }
    var smemory = sandbox.smemory;
    var arraydb = {};

    var uint8arr = new Uint8Array(1);
    var uint8clamparr = new Uint8ClampedArray(1);
    var uint16arr = new Uint8Array(1);
    var uint32arr = new Uint32Array(1);
    var int8arr = new Int8Array(1);
    var int16arr = new Int16Array(1);
    var int32arr = new Int32Array(1);
    var float32arr = new Float32Array(1);
    var float64arr = new Float64Array(1);


    function testElementFit(shadowInfo, val){
        if(!shadowInfo.fitarray){ // init array fit spectrum
            shadowInfo.fitarray = {};
            shadowInfo.fitarray.uint8arr = true;
            shadowInfo.fitarray.uint8clamparr = true;
            shadowInfo.fitarray.uint16arr = true;
            shadowInfo.fitarray.uint32arr = true;
            shadowInfo.fitarray.int8arr = true;
            shadowInfo.fitarray.int16arr = true;
            shadowInfo.fitarray.int32arr = true;
            shadowInfo.fitarray.float32arr = true;
            shadowInfo.fitarray.float64arr = true;
        }

        if(typeof val === 'number'){
            // fit into Uint8Array?
            if(shadowInfo.fitarray.uint8arr){
                uint8arr[0] = val;
                if(val !== uint8arr[0]){
                    shadowInfo.fitarray.uint8arr = false;
                }
            }
            if(shadowInfo.fitarray.uint8clamparr){
                uint8clamparr[0] = val;
                if(val !== uint8clamparr[0]){
                    shadowInfo.fitarray.uint8clamparr = false;
                }
            }
            if(shadowInfo.fitarray.uint16arr){
                uint16arr[0] = val;
                if(val !== uint16arr[0]){
                    shadowInfo.fitarray.uint16arr = false;
                }
            }
            if(shadowInfo.fitarray.uint32arr){
                uint32arr[0] = val;
                if(val !== uint32arr[0]){
                    shadowInfo.fitarray.uint32arr = false;
                }
            }
            if(shadowInfo.fitarray.int8arr){
                int8arr[0] = val;
                if(val !== int8arr[0]){
                    shadowInfo.fitarray.int8arr = false;
                }
            }
            if(shadowInfo.fitarray.int16arr){
                int16arr[0] = val;
                if(val !== int16arr[0]){
                    shadowInfo.fitarray.int16arr = false;
                }
            }
            if(shadowInfo.fitarray.int32arr){
                int32arr[0] = val;
                if(val !== int32arr[0]){
                    shadowInfo.fitarray.int32arr = false;
                }
            }
            if(shadowInfo.fitarray.float32arr){
                float32arr[0] = val;
                if(val !== float32arr[0]){
                    shadowInfo.fitarray.float32arr = false;
                }
            }
            if(shadowInfo.fitarray.float64arr){
                float64arr[0] = val;
                if(val !== float64arr[0]){
                    shadowInfo.fitarray.float64arr = false;
                }
            }
        }
    }

    function SetArrayPropertyHandler(iid, base, offset, val){
        if(Array.isArray(base) && typeof offset === 'number'){
            var shadowInfo = smemory.getShadowObject(base);
            if(!shadowInfo.types) shadowInfo.types = {};
            if(!shadowInfo.count)
                shadowInfo.count = 1;
            else
                shadowInfo.count++;

            var type = typeof val;
            if(type === 'number') { // distinguish between int and double
                if(val === val|0)
                    type = 'int';
                else
                    type = 'double';
            }

            shadowInfo.readOnly = false;
            shadowInfo.count++;

            if(!shadowInfo.maxIndex) {
                shadowInfo.maxIndex = 0;
            }

            if(shadowInfo.maxIndex < offset){
                shadowInfo.maxIndex = offset;
            }

            if(type!=='int' && type!=='double')
                shadowInfo.isNonNumeric = true;

            if(shadowInfo.isNonNumeric === true) {
                // do nothing
            } else {
                testElementFit(shadowInfo, val);
            }

            if(shadowInfo.types[type]){
                shadowInfo.types[type]++;
            } else {
                shadowInfo.types[type] = 1;
            }
        }

        if(Array.isArray(base) && typeof offset === 'string' && isNaN(parseInt(offset))){
            var shadowInfo = smemory.getShadowObject(base);
            if(shadowInfo.source) {
                shadowInfo.propsSet[offset] = true;
            }
        }
    }

    function getArrayPropertyHandler(iid, base, offset, val){
        if(Array.isArray(base) && typeof offset === 'number'){
            var shadowInfo = smemory.getShadowObject(base);
            shadowInfo.count++;
        }

        if(Array.isArray(base) && typeof offset === 'string' && isNaN(parseInt(offset))){
            var shadowInfo = smemory.getShadowObject(base);
            if(shadowInfo.source){
                shadowInfo.propsGet[offset] = true;
            }
        }
    }

    function ArrayType() {
        // called before setting field to an entity (e.g., object, function etc.)
        // base is the entity, offset is the field name, so val === base[offset]
        // should return val
        this.putFieldPre = function (iid, base, offset, val) {
            SetArrayPropertyHandler(iid, base, offset, val);
            return val;
        }

        // before retrieving field from an entity
        this.getField = function (iid, base, offset, val) {
            getArrayPropertyHandler(iid, base, offset, val);
            return val;
        }

        // during creating a literal
        // should return val
        this.literal = function (iid, val) {
            if(Array.isArray(val)){
                var shadowInfo = smemory.getShadowObject(val);
                if(!shadowInfo.source) {
                    shadowInfo.source = iid;
                    shadowInfo.readOnly = true;
                    shadowInfo.functions_use = {};
                    shadowInfo.typeof_use = false;
                    shadowInfo.propsSet = {};
                    shadowInfo.propsGet = {};
                    shadowInfo.count = 1;
                    if(!arraydb[iid])
                        arraydb[iid] = [];
                    arraydb[iid].push(val);
                }
            }
            return val;
        }


        // during invoking a function/method
        // val is the return value and should be returned
        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            if(f === ARRAY_CONSTRUCTOR) {
                var shadowInfo = smemory.getShadowObject(val);
                if(!shadowInfo.source) {
                    shadowInfo.source = iid;
                    shadowInfo.readOnly = true;
                    shadowInfo.functions_use = {};
                    shadowInfo.typeof_use = false;
                    shadowInfo.propsSet = {};
                    shadowInfo.propsGet = {};
                    shadowInfo.count = 1;
                    if(!arraydb[iid])
                        arraydb[iid] = [];
                    arraydb[iid].push(val);
                }
            }

            if(f === ARRAY_CONSTRUCTOR.prototype.push && Array.isArray(base)){
                var shadowInfo = smemory.getShadowObject(base);
                if(shadowInfo.source) {
                    shadowInfo.readOnly = false;
                    shadowInfo.functions_use.push = true;
                    SetArrayPropertyHandler(iid, base, base.length, args[0]);
                }
            } else if(f === ARRAY_CONSTRUCTOR.prototype.pop && Array.isArray(base)){
                var shadowInfo = smemory.getShadowObject(base);
                if(shadowInfo.source) {
                    shadowInfo.readOnly = false;
                    shadowInfo.functions_use.pop = true;
                    shadowInfo.count++;
                }
            } else if(Array.isArray(base)) {
                var shadowInfo = smemory.getShadowObject(base);
                if(shadowInfo.source) {
                    shadowInfo.functions_use[f.name] = true;
                    shadowInfo.count++;
                }
            }
            return val;
        }

        // during a unary operation
        // result_c is the result and should be returned
        this.unary = function (iid, op, left, result_c) {
            if(Array.isArray(left)){
                if(op === 'typeof'){
                    var shadowInfo = smemory.getShadowObject(left);
                    if(shadowInfo.source) {
                        shadowInfo.typeof_use = true;
                        shadowInfo.count++;
                    }
                }
            }
            return result_c;
        }

        this.endExecution = function () {
            var failArraySource = [];
            var reportDB = {};
            var readOnlyDB = {};
            console.log('gathering data...');

            iid_loop:
                for(var iid in arraydb) {
                    reportDB[iid] = {maxIndices: [], fitarray: {}, functions_use:[],
                        typeof_use: false, delete_use: false, length_use: false,
                        propsSet: {}, propsGet: {}, passToExternalFunction: false, count: 0};

                    if(HOP(arraydb, iid)){
                        var innerDB = arraydb[iid];
                        inner_loop:
                            for(var i=0;i<innerDB.length;i++){
                                var array = innerDB[i];
                                var shadowInfo = smemory.getShadowObject(array);
                                if((shadowInfo.source+ '') !== (iid+'')) {
                                    throw new Error('iid does not equal to shadowInfo.source!');
                                }

                                // if array contains non-numeric element, remove it from the reportDB and put it into failedArraySource
                                if(shadowInfo.isNonNumeric === true){
                                    delete reportDB[iid];
                                    failArraySource[shadowInfo.source] = 'array stores non-numeric elements';
                                    continue iid_loop;
                                }


                                if(!HOP(readOnlyDB, iid)){
                                    readOnlyDB[iid] = true;
                                }

                                if(shadowInfo.readOnly === false){
                                    readOnlyDB[iid] = false;
                                }

                                reportDB[iid].count += shadowInfo.count;

                                // collect array fit info.
                                if(shadowInfo.types) {
                                    reportDB[iid].maxIndices[shadowInfo.maxIndex] = 1;

                                    // print suggestions for array type
                                    if(shadowInfo.fitarray){
                                        for(var arrtype in shadowInfo.fitarray){
                                            if(HOP(shadowInfo.fitarray, arrtype)){
                                                // init type info in reportDB[iid]
                                                if(!HOP(reportDB[iid].fitarray, arrtype)){
                                                    (reportDB[iid].fitarray)[arrtype] = true;
                                                }
                                                if((shadowInfo.fitarray)[arrtype] === false){
                                                    (reportDB[iid].fitarray)[arrtype] = false;
                                                }
                                            }
                                        }
                                    }

                                    if(shadowInfo.functions_use){
                                        for(var fun in shadowInfo.functions_use){
                                            if(HOP(shadowInfo.functions_use, fun)){
                                                reportDB[iid]['functions_use'][fun] = true;
                                            }
                                        }
                                    }

                                    if(shadowInfo.propsSet) {
                                        for(var offset in shadowInfo.propsSet){
                                            if(HOP(shadowInfo.propsSet, offset)){
                                                reportDB[iid]['propsSet'][offset] = true;
                                            }
                                        }
                                    }

                                    if(shadowInfo.propsGet) {
                                        for(var offset in shadowInfo.propsGet){
                                            if(HOP(shadowInfo.propsGet, offset)){
                                                reportDB[iid]['propsGet'][offset] = true;
                                            }
                                        }
                                    }

                                    if(HOP(shadowInfo, 'typeof_use')) {
                                        if(shadowInfo.typeof_use === true){
                                            reportDB[iid]['typeof_use'] = true;
                                        }
                                    }
                                }
                            }
                    }
                }

            // prioritize warnings
            // currently based on array operation count
            var iidArray = [];
            for(var iid in reportDB){
                if(HOP(reportDB, iid)){
                    iidArray.push({'iid':iid, value: reportDB[iid].count});
                }
            }
            // prioritization function
            iidArray.sort(function (a, b){
                return b.value - a.value;
            });

            // print final results
            console.log('-------------Fix Array Refactor Report-------------');
            console.log('Array created at the following locations may be special-typed:');
            for (var i = 0; i < iidArray.length; i++) {
                var iid = iidArray[i].iid;
                // print location
                console.log('location: ' + iidToLocation(iid));
                console.log('\t[Oper-Count]:\t' + reportDB[iid].count);

                if (readOnlyDB[iid] === true) {
                    console.log('\t[READONLY]');
                } else {
                    // print max indices
                    var maxIndicesBuffer = [];
                    for (var index in reportDB[iid].maxIndices) {
                        if (HOP(reportDB[iid].maxIndices, index)) {
                            maxIndicesBuffer.push(index);
                        }
                    }
                    console.log('\t[Max-Indices]:\t' + JSON.stringify(maxIndicesBuffer));

                    // print typed arrays that can be cast to
                    var arrayFitBuffer = [];
                    for (var arrType in reportDB[iid].fitarray) {
                        if (HOP(reportDB[iid].fitarray, arrType)) {
                            if ((reportDB[iid].fitarray)[arrType] === true) {
                                arrayFitBuffer.push(arrType);
                            }
                        }
                    }
                    console.log('\t[Refactor-Opts]: ' + JSON.stringify(arrayFitBuffer));
                }

                if (HOP(reportDB[iid], 'functions_use')) {
                    var funUseBuffer = [];
                    for (var fun in reportDB[iid]['functions_use']) {
                        if (HOP(reportDB[iid]['functions_use'], fun)) {
                            funUseBuffer.push(fun);
                        }
                    }
                    if (funUseBuffer.length > 0) {
                        console.log('\t[Func-Used]: ' + JSON.stringify(funUseBuffer));
                    }
                }

                if (HOP(reportDB[iid], 'propsSet')) {
                    var propSetBuffer = [];
                    for (var p in reportDB[iid]['propsSet']) {
                        if (HOP(reportDB[iid]['propsSet'], p)) {
                            propSetBuffer.push(p);
                        }
                    }
                    if (propSetBuffer.length > 0) {
                        console.log('\t[Prop-Set]: ' + JSON.stringify(propSetBuffer));
                    }
                }

                if (HOP(reportDB[iid], 'propsGet')) {
                    var propGetBuffer = [];
                    for (var p in reportDB[iid]['propsGet']) {
                        if (HOP(reportDB[iid]['propsGet'], p)) {
                            propGetBuffer.push(p);
                        }
                    }
                    if (propGetBuffer.length > 0) {
                        console.log('\t[Prop-Get]: ' + JSON.stringify(propGetBuffer));
                    }
                }

                if (HOP(reportDB[iid], 'typeof_use')) {
                    if (reportDB[iid].typeof_use === true) {
                        console.log('\t[Typeof]: \'typeof\' applied');
                    }
                }
            }

            console.log('---------------------------------------------------');
            // print array constructing locations that could not be typed
            console.log('Following arrays can not be typed:');
            for(var iid in failArraySource){
                if(HOP(failArraySource, iid)){
                    console.log('[x]\t' + iidToLocation(iid) + '\t' + failArraySource[iid]);
                }
            }
        }
    }

    sandbox.analysis = new ArrayType();
})(J$));