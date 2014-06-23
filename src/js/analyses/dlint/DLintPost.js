/*
 * Copyright 2014 University of California, Berkeley
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

(function(sandbox) {
    function DLintPost() {
        var smemory = sandbox.smemory;
        var iidToLocation = sandbox.iidToLocation;
        var Constants = sandbox.Constants;
        var Config = sandbox.Config;
        var HOP = Constants.HOP;
        var sort = Array.prototype.sort;

        this.endExecution = function() {
            // 1) write warnings to file
            if (sandbox.Constants.isBrowser) {
                console.log("Sending results to jalangiFF");
                window.$jalangiFFLogResult(JSON.stringify(sandbox.dlintWarnings), true);
            } else {
                var fs = require("fs");
                var outFile = process.cwd() + "/analysisResults.json";
                console.log("Writing analysis results to " + outFile);
                fs.writeFileSync(outFile, JSON.stringify(sandbox.dlintWarnings));
            }
            
            // 2) print warnings to console
            sandbox.dlintWarnings.forEach(function (w) {
                console.log("dlint warning: "+w);
            });
        };
    }

    sandbox.analysis = new DLintPost();

}(J$));