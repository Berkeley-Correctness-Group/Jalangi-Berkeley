var fs = require("fs");
var f = process.argv[2];
var d = fs.readFileSync(f);
var j = JSON.parse(d);
fs.writeFileSync(f, JSON.stringify(j, 0, 2));
