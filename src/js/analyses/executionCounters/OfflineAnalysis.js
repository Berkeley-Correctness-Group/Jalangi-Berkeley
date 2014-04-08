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

    var fs = require('fs');

    function readFile(fileName) {
        var data = fs.readFileSync(fileName);
        return JSON.parse(data);
    }
    
    function Counters() {
        this.calls = 0;
        this.conditionals = 0;
    }
    
    function analyze(results) {
        var benchmark2Counters = {};
        results.forEach(function (result) {
            var urlSuffix = result.url.slice("http://127.0.0.1/".length);
            var benchmark = urlSuffix.slice(0, urlSuffix.indexOf("/"));
            var counters = benchmark2Counters[benchmark] || new Counters();
            counters.calls += result.value.callCtr;
            counters.conditionals += result.value.condCtr;
            benchmark2Counters[benchmark] = counters;
        });
        
        console.log("Benchmark, Calls, Conditionals");
        for (var bm in benchmark2Counters) {
            var counters = benchmark2Counters[bm];
            console.log(bm+","+counters.calls+","+counters.conditionals);
        }
    }
    
    var results = readFile(process.argv[2]);
    analyze(results);

})();