//
// wordpress:
// 		https://core.trac.wordpress.org/ticket/19390
// 	fixed by:
// 		https://core.trac.wordpress.org/attachment/ticket/19390/19390.diff
//

//this is a library function or something
function getItem(phase_of_moon) {
	if (phase_of_moon) { 
		return "test value";
	}
}

function criticalFn(should_be_string) {
	console.log(should_be_string.length);
}


var b = getItem(false);
var a = getItem(true);
// fix changed to:
// criticalFn(getItem(true) || "");
criticalFn(getItem(true));

