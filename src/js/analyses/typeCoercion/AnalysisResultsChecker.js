// Author: Michael Pradel

// helper tool to check if analysisResults.json has been created
(function() {

    var fs = require('fs');

    var baseDir = "/home/m/research/projects/Jalangi-Berkeley/type_coercions_results/websites/";

    var done = [];
    var notDone = [];
    var files = fs.readdirSync(baseDir);
    for (var i = 0; i < files.length; i++) {
        var f = files[i]
        var bmDir = baseDir + f;
        if (fs.lstatSync(bmDir).isDirectory()) {
            if (fs.readdirSync(bmDir).indexOf("analysisResults.json") === -1) {
                notDone.push("http://"+f);
            } else {
                done.push("http://"+f);
            }
        }
    }

    console.log("DONE:\n" + done.join("\n") + "\n");
    console.log("NOT DONE:\n" + notDone.join("\n"))


})();