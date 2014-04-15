// 
// wordpress:
//    https://core.trac.wordpress.org/ticket/22032
//  fixed by:
//    https://core.trac.wordpress.org/changeset/22140

function doSomething(obj) {
	var its_all_good = false;
	if(!obj)
		its_all_good = true;

// This should be included in the brackets.
	obj.prop;

	return its_all_good;
}
