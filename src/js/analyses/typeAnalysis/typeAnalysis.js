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
var root_object = this;

(function (sandbox) {

    function LikelyTypeInferEngineIB() {
        var smemory = sandbox.Globals.smemory;
        //var iidToLocation = sandbox.iidToLocation;
				  var iidToLocation = function(iid) {
						    var loc = sandbox.iidToLocation(iid);
								    return "(" + loc.substr(47, loc.length);
										  }

				var typeMem = require("./typeMem.js");
				var FunCallSig = require("./funCallSig.js");

				var mem = typeMem.makeMem();
				mem.annotateRootObj(root_object);
				var funCallStack = [new FunCallSig(mem)];

				var level = 0;
				var prevConstructor = false;

        // iid or type could be object(iid) | array(iid) | function(iid) | object(null) | object | function | number | string | undefined | boolean
        var iidToFieldTypes = {}; // type -> (field -> type -> iid -> true)
        var iidToSignature = {};  // type -> ({"this", "return", "arg1", ...} -> type -> iid -> true)
        var typeNames = {};
        var functionNames = {};

        function HOP(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        };

        function isArr(val) {
            return Object.prototype.toString.call(val) === '[object Array]';
        }

        var getSymbolic = this.getSymbolic = function(obj) {
            var sobj = smemory.getShadowObject(obj);
            if (sobj) {
                return sobj.shadow;
            } else {
                return undefined;
            }
        };

				function displayStack() {
					var str = "";
					for (var i = 0; i < funCallStack.length; i++) {
						var frame = funCallStack[i];
						if (i > 0) {
							str += " ";
						}
						str += frame.tDisplay();
					}

					console.log(str);
				}

				function getFrame() {
					return funCallStack[funCallStack.length - 1];
				}

        this.literal = function (iid, val) {
						mem.annotateLiteral(iid, val);
						return val;
						//console.log(iid, val);
            return annotateObject(iid, val);
        }

        this.putFieldPre = function (iid, base, offset, val) {
						var valtype = mem.getTypeObj(val)
						//console.log(valtype, valtype.id);
						var typeobj = mem.getTypeObj(base);
						typeobj.putFieldPre(mem, iid, offset, valtype);
						// console.log(iidToLocation(iid), base, offset, val);
						/*
            updateType(base, offset, val, iid);
						*/
            return val;
        }
        this.invokeFunPre = function (iid, f, base, args, isConstructor) {
					  prevConstructor = isConstructor;
						if (isConstructor) {
							console.log("====> " + iid);
						}
						// console.log(iidToLocation(iid));

						var typeobj = mem.getTypeObj(base);
						var funType = mem.getTypeObj(f);
						console.log(pad(level) + ">>" + iidToLocation(iid) + typeobj.tDisplay() + "   " +
												funType.tDisplay());

						funCallStack.push(new FunCallSig(mem, funType));
						//console.log(pad(level) + ">>" + iidToLocation(iid) + typeobj.tDisplay());
				}

        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
						if (isConstructor) {
							//console.log("<==== " + iid);
						}
						var typeobj = mem.getTypeObj(base);
						var rettype = mem.getTypeObj(val);

						var disType = mem.getTypeObj(base);

						var frame = getFrame();
						frame.setThisOut(disType);

						var frame = getFrame();
						frame.setRetVal(rettype);

						displayStack();
						funCallStack.pop();

            return val;
        }

        this.getField = function (iid, base, offset, val, isGlobal) {
            //var ret = annotateObject(iid, val);
						/*
            if (val !== undefined) {
                updateType(base, offset, val, iid);
            }
						*/
            //getConcrete(base)[getConcrete(offset)] = ret;
						console.log(offset);
            return val;
        }

				this.declare = function(iid, name, val, isArgument) {
						if (isArgument) {
							//console.log("declaring: " + name + " = " + val);
							var frame = getFrame();
							if (name === "arguments") {
								for (var aname in val) {
//									frame.setArg(aname, mem.getTypeObj(val[aname]));
								}
							} else {
  							frame.setArg(name, mem.getTypeObj(val));
							}
						}
				};

				this.functionEnter = function(iid, fun, dis /* this */) {
						if (prevConstructor) {
							mem.annotateAllocation(iid, dis, fun);
						} else {
							mem.annotateLiteral(iid, dis);
						}
						var disType = mem.getTypeObj(dis);
						console.log(pad(level) + ">> " + iidToLocation(iid) + disType.tDisplay());

						level += 1;
						var frame = getFrame();
						frame.setThisIn(mem.getTypeObj(dis));

					  //console.log(iid, fun);
				};

				this.functionExit = function(iid, fun, dis /* this */) {
						level -= 1;

						var disType = mem.getTypeObj(dis);

						var frame = getFrame();
						//frame.setThisOut(disType);
					  
						console.log(pad(level) + "<< " + iidToLocation(iid) + disType.tDisplay());
					  //console.log(iid, fun);
				};


				function pad(len) {
					var str = "";
					for(var i = 0; i < len; i++) {
						str += "  ";
					}
					return str;
				};
//        this.read = function(iid, name, val) {
//            return annotateObject(iid, val);
//        }

        this.endExecution = function () {
					console.log(mem.displayMem());
            //console.log(JSON.stringify(iidToFieldTypes, null, '\t'));
					require('fs').writeFileSync("/tmp/research/typesplot.json", JSON.stringify(mem.jsonDump()));
        }



    }

    if (sandbox.Constants.isBrowser) { 
    		sandbox.analysis = new LikelyTypeInferEngineIB();
        window.addEventListener('keydown', function (e) { 
            // keyboard shortcut is Alt-Shift-T for now
            if (e.altKey && e.shiftKey && e.keyCode === 84) { 
                sandbox.analysis.endExecution();
            } 
        });
    } else { 
        module.exports = LikelyTypeInferEngineIB;
    } 


}(typeof J$ === 'undefined'? (J$={}):J$));
