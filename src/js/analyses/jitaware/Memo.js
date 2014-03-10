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
	var HOP = function (obj, prop) {
		return (prop + "" === '__proto__') || HAS_OWN_PROPERTY_CALL.apply(HAS_OWN_PROPERTY, [obj, prop]);
	}
	var instructCnt = 0;
	var instCntList = [];
	var fundb = {};


	function Memo() {
		// called before reading a variable
		this.readPre = function (iid, name, val, isGlobal) {
		}
		
		// called during reading a variable, 
		// val is the read value, do not forget to return it
		this.read = function (iid, name, val, isGlobal) {
			if(instructCnt%500000===0){
				console.log('No. of instructions processed: ' + instructCnt);
			}
			instructCnt++;
			return val;
		}
		
		// called before writing a variable
		this.writePre = function (iid, name, val) {
		}

		// called during writing a variable
		// val is the value to be written, do not forget to return it
		this.write = function (iid, name, val) {
			instructCnt++;
			return val;
		}
		
		// called before setting field to an entity (e.g., object, function etc.)
		// base is the entity, offset is the field name, so val === base[offset]
		// should return val
		this.putFieldPre = function (iid, base, offset, val) {
			return val;
		}

		// called during setting field
		// should return val
		this.putField = function (iid, base, offset, val) {
			instructCnt++;
			return val;
		}
		
		// before retrieving field from an entity
		this.getFieldPre = function (iid, base, offset) {
		}

		// during retrieving field from an entity
		this.getField = function (iid, base, offset, val) {
			instructCnt++;
			return val;
		}
		
		// before creating a literal
		this.literalPre = function (iid, val) {
		}

		// during creating a literal
		// should return val
		this.literal = function (iid, val) {
			instructCnt++;
			return val;
		}

		// before invoking a function/method
		this.invokeFunPre = function (iid, f, base, args, isConstructor) {
			//console.log('before calling ' + f.name + ': ' + instructCnt);
			instCntList.push(instructCnt);
		}

		// during invoking a function/method
		// val is the return value and should be returned
		this.invokeFun = function (iid, f, base, args, val, isConstructor) {
			instructCnt++;
			if(args.length = 0)
				return val;
			try{
				var InstructPre = instCntList.pop();
				var instructCntDiff = (instructCnt - InstructPre);
				var sig = f.toString();
				if(fundb[sig]) {
					if(fundb[sig].isMem === false){
						return val;
					}
					fundb[sig].totalInst += instructCntDiff;
					fundb[sig].cnt ++;
				} else {
				  fundb[sig] = {totalInst: instructCntDiff, cnt: 1, fun: f, io:{}, isMem: true, redOpCnt: 0, location: iid};
				}

				var inputSig = JSON.stringify(args);
				if(fundb[sig][inputSig]){
					if(fundb[sig][inputSig] === val && typeof val !== 'undefined'){
						fundb[sig].redOpCnt++; // a redundant operation
					} else {
						// clear memory
						delete fundb[sig];
						fundb[sig] = {isMem: false};
					}
				} else {
					// give up when the function's redundant rate is less than 10%
					if(fundb[sig].cnt > 1000 && fundb[sig].redOpCnt < 10) {
						// clear memory
						delete fundb[sig];
						fundb[sig] = {isMem: false};
					} else {
						fundb[sig][inputSig] = val;
					}
				}
			}catch(e){
				// some objects can not be stringified
				// make sure that exception do not crash the execution
			}
			return val;
		}
		
		// before doing a binary operation
		this.binaryPre = function (iid, op, left, right) {
		}

		// during a binary operation
		// result_c is the result and should be returned
		this.binary = function (iid, op, left, right, result_c) {
			instructCnt++;
			return result_c;
		}

		// before doing a unary operation
		this.unaryPre = function (iid, op, left) {
		}

		// during a unary operation
		// result_c is the result and should be returned
		this.unary = function (iid, op, left, result_c) {
			instructCnt++;
			return result_c;
		}

		// before getting a conditional expression evaluation
		this.conditionalPre = function (iid, left) {
		}

		// during a conditional expression evaluation
		// result_c is the evaluation result and should be returned
		this.conditional = function (iid, left, result_c) {
			instructCnt++;
			return result_c;
		}
		
		this.endExecution = function () {
			console.log('The following functions/methods may be memoized:');
			for(var prop in fundb) {
				if(HOP(fundb, prop)){
					var info = fundb[prop];
					if(info.isMem === true) {
						var avgInst = info.totalInst/info.cnt;
						if(avgInst < 200) continue;
						var redrate = info.redOpCnt/info.cnt;
						if(redrate < 0.2) continue;
						console.log(info.fun.name + ', instructions on average to complete: ' + avgInst);
						console.log('\t' + 'redundant Rate: ' + redrate + '(' + info.redOpCnt + '/' + info.cnt +')');
						console.log('\t' + 'location: ' + iidToLocation(info.location));
						console.log('\t' + 'iid: ' + info.location);
						//console.log('\t\t' + info.fun.toString());
					}
				}
			}
		}
	}

    if (sandbox.Constants.isBrowser) {
        sandbox.analysis = new Memo();
        window.addEventListener('keydown', function (e) {
            // keyboard shortcut is Alt-Shift-T for now
            if (e.altKey && e.shiftKey && e.keyCode === 84) {
                sandbox.analysis.endExecution();
            }
        });
    } else {
        module.exports = Memo;
    }
})(typeof J$ === 'undefined'? (J$={}):J$));

