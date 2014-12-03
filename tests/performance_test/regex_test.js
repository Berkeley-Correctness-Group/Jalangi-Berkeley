

// conclusion, looks like v8 engine does recompile the regular expression every time.

var startTime = new Date();
for (var i=0;i<1000000000;i++){
	var regex = /^[&5asd]/;
	regex.test('asdfasdf');
}
var endTime = new Date();

console.log((endTime - startTime)/1000 + 's'); // 38.723 seconds

console.log('global regex');


var regex2 = /^[&5asd]/;
var startTime = new Date();
for (var i=0;i<1000000000;i++){
	//var regex = {};
	regex2.test('asdfasdf');
}
var endTime = new Date();

console.log((endTime - startTime)/1000 + 's'); // 35.142 seconds