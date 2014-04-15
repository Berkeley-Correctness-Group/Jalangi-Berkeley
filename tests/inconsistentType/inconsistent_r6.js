// 
// moodle:
//   https://tracker.moodle.org/browse/MDL-35754
// fix:
//   https://github.com/coderader/moodle_23/commit/4f9b4f044c0a5ae23a8d494f67e117352a8df75c#diff-74e3cf3dafffebc0218b9d6a1b84cfa0R1199
// 


var nameregex = /[^a-z0-9_]/i;

function sanitize_name(args) {
	if(args.name.match(nameregex)) {
		args.name = args.name.replace(nameregex, '_');
	}
}

var a = {name:"asdf"};
var b = {}
sanitize_name(a);
sanitize_name(b);
