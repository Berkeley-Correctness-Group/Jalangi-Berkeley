(function(sandbox) {

  function HOP(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	};

	function FunInvokeMap(mem, funtype) {
		mem.getId(this);
		this.mem = mem;
		this.funtype = funtype;
		this.args = {};
	}

	FunInvokeMap.prototype = {
		setArg : function(name, val) {
			this.args[name] = val;
		},
		setThisIn : function(val) {
			this.thisin = val;
		},
		setThisOut : function(val) {
			this.thisout = val;
		},
		setRetVal : function(val) {
			this.retval = val;
		},
		tDisplay : function() {
			var str = "";
			var args = "";
			var arglen = 0;
			if (this.args["arguments"] !== undefined) {
				arglen = this.args["arguments"].length;
			}
			for (var name in this.args) {
				if (name !== "arguments") {
					args += name + " => " + this.args[name].tDisplay() + ", ";
				}
			}
			if (arglen != 0) {
				args += "arglst:" + this.args["arguments"].tDisplay();
			}
			var name = "__main__";
			var id = "unidentified";
			if (this.funtype !== undefined) {
				name = this.funtype.fun.name;
				id = this.funtype.id;
			}
			var v = "?";
			if (this.thisin !== undefined) {
				v = this.thisin.id; 
				//tDisplay();
			}
			v = v + " -> ";
			if (this.thisout !== undefined) {
				v += this.thisout.id; 
				//tDisplay();
			} else {
				v += "?";
			}

			return name + " " + id + " " + v + " " + '{args: ' + args + '}';
		},
		jsonDump : function () {
			var argsId = {};
			for (var key in this.args) {
				if (HOP(this.args, key)) {
					argsId[key] = this.args[key].id;
				}
			}
			return {
				FunInvokeMap : {},
				args : argsId,
				funtype : opToId(this.funtype),
				thisin : opToId(this.thisin),
				thisout : opToId(this.thisout),
			};
		}
	};

	function opToId(val) {
		if (val !== undefined) {
			return val.id;
		}
		return undefined;
	}

	module.exports = FunInvokeMap;

}(typeof J$ === 'undefined'? (J$={}):J$));
