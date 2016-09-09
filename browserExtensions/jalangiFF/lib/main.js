// Author: Michael Pradel

(function() {

    console.log("jalangiFF: running");

    // imports
    var pageMod = require("sdk/page-mod");
    var data = require("sdk/self").data;
    var ioFile = require("sdk/io/file");

    // parameters
    var resultFile = "/tmp/analysisResults.json";

    var pageWorker;
    pageMod.PageMod({
        include:"*",
        contentScriptFile:[
            data.url("analysisResultLogger.js")
        ],
        contentScriptWhen:'start',
        attachTo:'top',
        onAttach:function(worker) {
            pageWorker = worker;
            pageWorker.port.on("logResult", logResult);
            worker.on("pagehide", function() {
                console.log("pagehide");
                pageWorker = undefined;
            });
            worker.on("pageshow", function() {
                console.log("pageshow");
                pageWorker = this;
                pageWorker.port.on("logResult", logResult);
            });
            console.log("jalangiFF: attached to page");
        }
    });

    var allResults = [];
    function logResult(json, append) {
        console.log("Received results in main.js of jalangiFF");
        var result = JSON.parse(json);
        if (append) {
            allResults.push(result);
        } else {
            allResults = [ result ];
        }
        var f = ioFile.open(resultFile, "w");
        f.write(JSON.stringify(allResults));
        f.close();
    }

})();
