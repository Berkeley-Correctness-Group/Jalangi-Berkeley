/*
 * Copyright (c) 2014, University of California, Berkeley
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those
 * of the authors and should not be interpreted as representing official policies,
 * either expressed or implied, of the FreeBSD Project.
 */

// Author: Liang Gong

// Command Line Usage:
// node src/js/commands/benchmark_exp.js
// 1. clear console.txt
// 2. clear experiment.csv
// 3. start experiment for Sunspider
// 4. start experiment for Octane

var fs = require('fs')

convert_result_to_table(process.cwd() + '/tests/jitaware/experiments/exp_output/micro_results_db.js');

// convert result_db into csv file
function convert_result_to_table(db_path) {
    var content = fs.readFileSync(db_path);
    var output = [];
    var db = JSON.parse(content);
    for (var prop in db) {
        if (db.hasOwnProperty(prop)) {
            for (benchmark in db[prop]) {
                if (db[prop].hasOwnProperty(benchmark)) {
                    var curdb = [];
                    curdb.push(prop + '-' + benchmark);
                    var values = db[prop][benchmark];
                    for (var i = 0; i < values.length; i++) {
                        curdb.push(values[i]);
                    }
                    output.push(curdb.join(','));
                }
            }
        }
    }
    fs.writeFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/micro_result.csv', output.join('\n'));
}