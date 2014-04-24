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

J$.analysis = {};

((function (sandbox){
    var Constants = (typeof sandbox.Constants === 'undefined' ? require('./Constants.js') : sandbox.Constants);
    var iidToLocation = Constants.load("iidToLocation");
    var HAS_OWN_PROPERTY = Object.prototype.hasOwnProperty;
    var HAS_OWN_PROPERTY_CALL = Object.prototype.hasOwnProperty.call;
    var ARRAY_CONSTRUCTOR = Array;
    var HOP = function (obj, prop) {
        return (prop + "" === '__proto__') || HAS_OWN_PROPERTY_CALL.apply(HAS_OWN_PROPERTY, [obj, prop]);
    }
    var smemory = sandbox.Globals.smemory || sandbox.smemory;
    var arraydb = {};

    var uint8arr = new Uint8Array(1);
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

    function ArrayType() {
        // called before setting field to an entity (e.g., object, function etc.)
        // base is the entity, offset is the field name, so val === base[offset]
        // should return val
        this.putFieldPre = function (iid, base, offset, val) {
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
            return val;
        }

        // during creating a literal
        // should return val
        this.literal = function (iid, val) {
            if(Array.isArray(val)){
                var shadowInfo = smemory.getShadowObject(val);
                if(!shadowInfo.source) {
                    shadowInfo.source = iid;
                    if(!arraydb[iid+"_"])
                        arraydb[iid+"_"] = [];
                    arraydb[iid+"_"].push(val);
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
                    if(!arraydb[iid+"_"])
                        arraydb[iid+"_"] = [];
                    arraydb[iid+"_"].push(val);
                }
            }
            return val;
        }

        this.endExecution = function () {
            var failDB = {};
            console.log('The following array could be fix typed:');
            for(var prop in arraydb) {
                if(HOP(arraydb, prop)){
                    var innerDB = arraydb[prop];
                    inner_loop:
                    for(var i=0;i<innerDB.length;i++){
                        var array = innerDB[i];
                        var shadowInfo = smemory.getShadowObject(array);
                        if(shadowInfo.isNonNumeric === true){
                            var failmsg = '[X] array created @ [iid: ' + shadowInfo.source + ']' + iidToLocation(shadowInfo.source);
                            failDB[failmsg] = 1;
                            continue inner_loop;
                        }

                        if(shadowInfo.types) {
                            console.log('array created @ [iid: ' + shadowInfo.source + ']' + iidToLocation(shadowInfo.source));
                            console.log('max index:' + shadowInfo.maxIndex);
                            for(var type in shadowInfo.types) {
                                if(HOP(shadowInfo.types, type)){
                                    console.log('\t' + '['+ type +']:\t' + shadowInfo.types[type]);
                                }
                            }

                            // print suggestions for array type
                            if(shadowInfo.fitarray){
                                for(var arrtype in shadowInfo.fitarray){
                                    if(HOP(shadowInfo.fitarray, arrtype)){
                                        console.log('\t\t' + arrtype + ':\t' + shadowInfo.fitarray[arrtype]);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            console.log('array created at the following locations can not be special-typed:');
            // print array constructing locations that could not be typed
            for(var prop in failDB){
                if(HOP(failDB, prop)){
                    console.log(prop);
                }
            }
        }
    }

    if (sandbox.Constants.isBrowser) {
        sandbox.analysis = new ArrayType();
        window.addEventListener('keydown', function (e) {
            // keyboard shortcut is Alt-Shift-T for now
            if (e.altKey && e.shiftKey && e.keyCode === 84) {
                sandbox.analysis.endExecution();
            }
        });
    } else {
        module.exports = ArrayType;
    }
})(typeof J$ === 'undefined'? (J$={}):J$));

