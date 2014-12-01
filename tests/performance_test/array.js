var startTime = new Date();
var array = new Array(10000000>>>3);
for(var i=0;i<10000000;i++) {
    array[i>>>3] += 1;
}
console.log((new Date() - startTime)/1000);


var startTime = new Date();
var array = new Int8Array(10000000>>>3);
for(var i=0;i<10000000;i++) {
    array[i>>>3] += 1;
}
console.log((new Date() - startTime)/1000);

var startTime = new Date();
var array = [];
for(var i=0;i<10000000;i++) {
    array[i>>>3] += 1;
}
console.log((new Date() - startTime)/1000);
