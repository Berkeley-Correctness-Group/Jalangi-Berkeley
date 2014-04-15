//
// Adapted from: https://github.com/cesmoak/smokescreen.git
//
// running on: http://www.freeactionscript.com/download/endless-parallax-scrolling-effect.swf
//

(function () {
	function do_thing(obj) {
		for (var i = 0; i < obj.spans.length; i++) {
			var span = obj.spans[i];

		}
	}

	function ObjType(config) {
		this.config = config;

		this.process();
	}

	ObjType.prototype = {
		process: function() {
			var config = this.config;
			if (!(config && config.length)) {
				return;
			}
			var spans = [];
			for (var i in config) {
				spans.push({id: i, val: config[i]});
			}
			this.spans = spans;
		}
	}
	var clist = [[1, 2, 3, 4], 
							[1, 2, 6, 9, 10, 12],
							[]];
	for (var i = 0; i < clist.length; i++) {
		var a = new ObjType(clist[i]);
		do_thing(a);
	}
})()
