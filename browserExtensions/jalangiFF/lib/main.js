/*
 * Copyright 2014 University of California, Berkeley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Michael Pradel

(function() {

    // imports
    var pageMod = require("sdk/page-mod");
    var commonUtil = require('./commonUtil.js');
    var data = require("sdk/self").data;
    var ioFile = require("sdk/io/file");

    // parameters
    var resultFile = "/tmp/analysisResults.json";

    var pageWorker;
    pageMod.PageMod({
        include:"*",
        contentScriptFile:[
            data.url("commonUtil.js"),
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

        }
    });

    var allResults = [];
    function logResult(url, json, append) {
        console.log("Received results in main.js of jalangiFF");
        var result = { url: url, value: JSON.parse(json) };
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