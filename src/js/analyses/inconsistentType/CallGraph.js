(function() {
	var data = {calls : {}, frame_fn : {}};
	var callstack = [];
	var calls = data.calls;
	var frame_fn = data.frame_fn;
	var f_name;

	exports.fEnter = function(smemory) {
		var f = smemory.getCurrentFrame();
		var f_shad = smemory.getShadowObject(f).shadow;
		if (f_name !== undefined) {
			frame_fn[f_name] = f_shad;
		}
		if (callstack.length > 0) {
			var caller_shad = callstack[callstack.length - 1];
			if (data[caller_shad] === undefined) {
				calls[caller_shad] = {};
			}
			calls[caller_shad][f_shad] = true;
//		console.log(JSON.stringify(f_shad));
//	console.log(f_shad, caller_shad);
		}
		callstack.push(f_shad);
	};

	exports.fExit = function(smemory) {
		callstack.pop();
	};

	exports.perpareBind = function(smemory, f, f_sym) {
		f_name = f_sym;
	};

	exports.data = data;
})();
