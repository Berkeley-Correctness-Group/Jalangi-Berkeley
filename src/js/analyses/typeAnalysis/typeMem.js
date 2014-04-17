(function(sandbox) {


	var smemory = sandbox.Globals.smemory;
	var iidToLocation = function(iid) {
		var loc = sandbox.iidToLocation(iid);
		return "(" + loc.substr(47, loc.length);
	}

	var FunCallSig = require("./funCallSig.js"); 

	function HOP(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	};
	function JsExtends(proto, parent) {
		var e_proto = Object.create(parent.prototype);
		for (var key in proto) {
			if (HOP(proto, key)) {
				e_proto[key] = proto[key];
			}
		}
		e_proto.constructor = parent;
		return e_proto;
	}

	function getSymbolic(obj, initShadow) {
		var sobj = smemory.getShadowObject(obj);
		if (sobj) {
			if (sobj.shadow === undefined) {
				var shadow = sobj.shadow = {};
				initShadow(obj, shadow);
			}
			return sobj.shadow;
		} else {
			return undefined;
		}
	};

	function getJsType(obj) {
		if (isArr(obj)) {
			return "array";
		}
		if (isGlobals(obj)) {
			return "root_object";
		}
		return typeof obj;
	}

	function getTypeName(obj) {
		if (obj === null) {
			return "null";
		}
		if (typeof obj === "object") {
//		console.log(obj);
		}
		return getJsType(obj);
	}

	function isArr(val) {
		return Object.prototype.toString.call(val) === '[object Array]';
	}

	function isGlobals(val) {
		return Object.prototype.toString.call(val) === '[object global]';
	}

	function Snapshot() {
		this.objUps = [];
	}

	function BuiltinTypeMap(mem, name) {
		this.name = name;
		mem.getId(this);
	}

	BuiltinTypeMap.prototype = {
		tDisplay : function(mem) {
			return "<" + this.name + ">";
		},
		jsonDump : function () {
			return {
				BuiltinTypeMap : {},
				typeName : this.name,
			};
		},
	};

	function BaseTypeMap(mem) {
		this.mem = mem;
		mem.getId(this);
		this.typeMap = {};
		this.revList = [mem.iter];
		this.typeMaps = [this.typeMap];
	}

	BaseTypeMap.prototype = {
		pushType : function(mem) {
			var newType = Object.create(this.typeMap);
			mem.iter ++;
			this.typeMap = newType;
			this.revList.push(mem.iter);
			this.typeMaps.push(newType);
		},
		tDisplay : function () {
			var str = "<";
			for(var key in this.typeMap) {
				str += key + ":" + this.typeMap[key] + ",  ";
			}
			return this.id + " " + str + ">";
		},
		putFieldPre : function(mem, iid, offset, val) {
			this.pushType(mem);
			this.typeMap[offset] = val.id
			//mem.applySnapshot();
			console.log(iidToLocation(iid), this.tDisplay(), offset, val.tDisplay());
		},
		jsonDump : function () {
			var idTypeMaps = [];
			for (var i = 0; i < this.typeMaps.length; i++) {
				var typeMap = this.typeMaps[i];
				var idtypeMap = {};
				for (var key in typeMap) {
					if (HOP(typeMap, key)) {
						idtypeMap[key] = typeMap[key];
					}
				}
				idTypeMaps.push(idtypeMap);
			}
			return {
				BaseTypeMap : {},
				revList : this.revList,
				typeMaps : idTypeMaps,
			};
		},
	};

	function ObjTypeMap(mem, obj, shadow) {
		BaseTypeMap.call(this, mem);
		shadow.id = this.id; //guard against recursion...
		this.obj = obj;
		console.log("adding fields for : " + this.obj);
		for (var key in obj) {
			if (HOP(obj, key)) {
				//this.typeMap[key] = this.mem.getTypeObj(undefined).id;
				this.typeMap[key] = this.mem.getTypeObj(obj[key]).id;
			}
		}
	}

	function FuncTypeMap(mem, fun) {
		BaseTypeMap.call(this, mem);
		this.fun = fun;
	}

	function ArrayTypeMap(mem, arr) {
		BaseTypeMap.call(this, mem);
		this.arr = arr;
	}

	ObjTypeMap.prototype = JsExtends({
		jsonDump : function () {
			return {
				ObjTypeMap : BaseTypeMap.prototype.jsonDump.call(this),
			};
		},
	}, BaseTypeMap);

	ArrayTypeMap.prototype = JsExtends({
		jsonDump : function () {
			return {
				ArrayTypeMap : BaseTypeMap.prototype.jsonDump.call(this),
			};
		},
	}, BaseTypeMap);

	FuncTypeMap.prototype = JsExtends({
		tDisplay : function () {
			var str = "<";
			for(var key in this.typeMap) {
				str += key + ":" + this.typeMap[key] + ",  ";
			}
			return this.id + ": " + this.fun.name + " " + str + ">";
		},
		jsonDump : function () {
			return {
				FuncTypeMap : BaseTypeMap.prototype.jsonDump.call(this),
				funname : this.fun.name
			};
		},
//		function(mem, iid, offset, val) {
//			console.log(iidToLocation(iid), offset, val);
//		},
	}, BaseTypeMap);

	function InstConsTypeMap(mem, obj, cons) {
		BaseTypeMap.call(this, mem);
		this.obj = obj;
		this.cons = cons;
	}

	InstConsTypeMap.prototype = JsExtends({
		tDisplay : function () {
			var str = BaseTypeMap.prototype.tDisplay.call(this);
			return this.cons.fun.name + " : " + this.cons.id + " : " + str;
		},
		jsonDump : function () {
			return {
				InstConsTypeMap : BaseTypeMap.prototype.jsonDump.call(this),
				cons : this.cons.id,
			};
		},
	}, ObjTypeMap);

	function FakeMem() {
		this.objs = [];
		this.iter = 0;
		this.obj_id = 0;
		this.snapshotChain = [];
		this.builtins = {
			number : new BuiltinTypeMap(this, "number"),
			string : new BuiltinTypeMap(this, "string"),
			undefined : new BuiltinTypeMap(this, "undefined"),
			boolean : new BuiltinTypeMap(this, "boolean"),
			null : new BuiltinTypeMap(this, "null"),
			root_object : new BuiltinTypeMap(this, "root_object"),
		};
	}

	FakeMem.prototype = {
		initObj : function(obj, shadow) {
			var type = getJsType(obj);
			var refType;
			if (type === "object") {
				refType = new ObjTypeMap(this, obj, shadow);
			} else if(type === "array") {
				refType = new ArrayTypeMap(this, obj);
			} else if(type === "function") {
				console.log("making new fun obj" + this.obj_id);
				refType = new FuncTypeMap(this, obj);
			}
			shadow.id = refType.id;
			//console.log(refType.id, obj, type, refType);
			return refType.id;
		},
		getId : function(refType) {
			var id = this.obj_id;
			this.obj_id += 1;
			this.objs[id] = refType;
			refType.id = id;
			return id;
		},
		annotateRootObj : function(val) {
			var mem = this;
			getSymbolic(val, function(obj, shadow) {
				console.log("adding id for root_object");
				shadow.id = mem.builtins.root_object.id;
			});
		},
		annotateLiteral : function(iid, val) {
			this.getShadow(val);
		},
		annotateAllocation : function(iid, val, fun) {
			var funType = this.getTypeObj(fun);
			var mem = this;
			var shadow = getSymbolic(val, function(obj, shadow) {
				var refType = new InstConsTypeMap(mem, obj, funType);
				shadow.id = refType.id;
			});
			return this.getTypeObj(val);
		},
		getShadow : function (val) {
			var mem = this;
			return getSymbolic(val, function(obj, shadow) {
				mem.initObj(obj, shadow);
			});
		},
		getObj : function (val) {
			var shadow = this.getShadow(val);
			//console.log(shadow, this.objs);
			return this.objs[shadow.id];
		},
		getTypeObj : function (val) {
			var tname = getTypeName(val);
			if(tname in this.builtins) {
				return this.builtins[tname];
			}
			var shadow = this.getShadow(val);
			if (shadow === undefined) {
			} else {
				return this.objs[shadow.id];
			}
		},
		displayMem : function () {
			var i = 0;
			var str = "snapshot: " + this.iter + "\n";
			for (var i = 0; i < this.objs.length; i++) {
				str += " - " + i + " " + this.objs[i].tDisplay() + "\n";
			}
			return str;
		},
		jsonDump : function () {
			var objsout = [];
			for (var i = 0; i < this.objs.length; i++) {
				objsout.push(this.objs[i].jsonDump());
			}
			return objsout;
		},
	};

	function makeMem() {
		return new FakeMem();
	}

	module.exports.makeMem = makeMem;
}(typeof J$ === 'undefined'? (J$={}):J$));
