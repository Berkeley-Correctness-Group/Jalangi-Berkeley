// Author: Michael Pradel

// helper tool to check if analysisResults.json has been created
(function() {

    var fs = require('fs');
    var util = require("./CommonUtil.js");

    var baseDir = "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/websites/";
    var allURLs = "/home/m/research/projects/Jalangi-Berkeley/tests/typeCoercion/alexa_top100_20140716.txt";

    var done = [];
    var notDone = [];
    var files = fs.readdirSync(baseDir);
    for (var i = 0; i < files.length; i++) {
        var f = files[i]
        var bmDir = baseDir + f;
        if (fs.lstatSync(bmDir).isDirectory()) {
            if (fs.readdirSync(bmDir).indexOf("analysisResults.json") === -1) {
                notDone.push("http://" + f);
            } else {
                done.push("http://" + f);
            }
        }
    }

    console.log("DONE:\n" + done.join("\n") + "\n");
    console.log("DONE BUT NO RESULTS:\n" + notDone.join("\n")+"\n")

    var urls = fs.readFileSync(allURLs, {encoding:"utf8"}).split("\n");
    var todo = util.substractSets(util.arrayToSet(urls), util.arrayToSet(done));

    console.log("STILL TO DO:\n" + Object.keys(todo).sort().join("\n"));


})();