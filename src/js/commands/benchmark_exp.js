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

// This experiment script is deprecated, selenium's JavaScript API can be unreliable sometimes.
// Use the following one instead:
// ./src/java/jitaware/experiment.sh 

// Command Line Usage:
// node src/js/commands/benchmark_exp.js
// 1. clear console.txt
// 2. clear experiment.csv
// 3. start experiment for Sunspider
// 4. start experiment for Octane

var sunspider_homepage = "localhost:8080/sunspider/driver.html";
var sunspider2_homepage = "localhost:8080/sunspider2/driver.html";
var octane_homepage = "localhost:8080/octane/octane.html";
var octane2_homepage = "localhost:8080/octane/octane_modified.html";

var child_process = require('child_process');
var webdriver = require('selenium-webdriver');
var path = require('path');
var fs = require('fs');
var browser_process;

var queue = ['octane-firefox', 'octane2-firefox', 'octane-chrome', 'octane2-chrome',
    'sunspider-firefox', 'sunspider2-firefox', 'sunspider-chrome', 'sunspider2-chrome'
];

var current_index = -1;
var repeat_time = 50;
var current_time = 0;
var current_label;

var config = {};
config['browser_cmd'] = {};
config['browser_cmd']['sunspider-firefox'] = '/Applications/Firefox.app/Contents/MacOS/firefox';
config['browser_cmd']['sunspider2-firefox'] = '/Applications/Firefox.app/Contents/MacOS/firefox';
config['browser_cmd']['octane-firefox'] = '/Applications/Firefox.app/Contents/MacOS/firefox';
config['browser_cmd']['octane2-firefox'] = '/Applications/Firefox.app/Contents/MacOS/firefox';

config['browser_cmd']['sunspider-chrome'] = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
config['browser_cmd']['sunspider2-chrome'] = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
config['browser_cmd']['octane-chrome'] = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
config['browser_cmd']['octane2-chrome'] = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';

config['url'] = {};
config['url']['sunspider-firefox'] = sunspider_homepage;
config['url']['sunspider2-firefox'] = sunspider2_homepage;
config['url']['octane-firefox'] = octane_homepage;
config['url']['octane2-firefox'] = octane2_homepage;

config['url']['sunspider-chrome'] = sunspider_homepage;
config['url']['sunspider2-chrome'] = sunspider2_homepage;
config['url']['octane-chrome'] = octane_homepage;
config['url']['octane2-chrome'] = octane2_homepage;

config['browser_arg'] = {};
config['browser_arg']['sunspider-firefox'] = ['-url', sunspider_homepage, '-console'];
config['browser_arg']['sunspider2-firefox'] = ['-url', sunspider2_homepage, '-console'];
config['browser_arg']['octane-firefox'] = ['-url', octane_homepage, '-console'];
config['browser_arg']['octane2-firefox'] = ['-url', octane2_homepage, '-console'];

config['browser_arg']['sunspider-chrome'] = ['-url', sunspider_homepage, '-console'];
config['browser_arg']['sunspider2-chrome'] = ['-url', sunspider2_homepage, '-console'];
config['browser_arg']['octane-chrome'] = ['-url', octane_homepage, '-console'];
config['browser_arg']['octane2-chrome'] = ['-url', octane2_homepage, '-console'];


//convert_result_to_table('./exp_output/results_db.js');
//return ;

// obtain the label for the next experiment
function getNextLabel() {
    if (current_time >= repeat_time) {
        return undefined;
    }

    current_index++;
    if (current_index >= queue.length) {
        current_index = 0;
        current_time++;
    }

    if (current_time >= repeat_time) {
        return current_label = undefined;
    }

    current_label = queue[current_index];
    return current_label;
}

// check if the parent directory has a sub-directory called jalangi_home
if (fs.existsSync('./tests/jitaware/experiments/exp_output')) {
    console.log('clear exp_output dir');
    child_process.exec('rm -r ./tests/jitaware/experiments/exp_output/*', function(error, stdout, stderr) {
        if (error !== null) {
            console.log('clear directory exp_output error: ' + error);
        }
        start_experiment();
    });
    return;
} else {
    fs.mkdirSync('./tests/jitaware/experiments/exp_output');
    start_experiment();
}

function start_experiment() {
    getNextLabel();
    if (!current_label) { // undefined label indicates all experiments are done
        console.log('experiment complete, converting results into csv file...');
        convert_result_to_table('./tests/jitaware/experiments/exp_output/results_db.js');
        console.log('csv table saved into: ' + process.cwd() + 'tests/jitaware/experiments/exp_output/result.csv');
        console.log('Please use excel to view the result.');
        return;
    }
    console.log('current experiment: ' + current_label);
    if (current_label.indexOf('firefox') >= 0) {
        test_on_firefox(); // run experiment on firefox
    } else if (current_label.indexOf('chrome') >= 0) {
        if (current_label.indexOf('sunspider') >= 0) {
            test_on_chrome_sunspider();
        } else if (current_label.indexOf('octane') >= 0) {
            test_on_chrome_octane()
        }
    } else {
        console.log('!!!! unknown label: ' + current_label);
    }
}

function terminate_firefox() {
    // either kill('SIGKILL') or kill('SIGINT') will brutally kill firefox which leads to a warning dialog prompted next time starting firefox
    console.log('start terminating firefox');
    child_process.exec('osascript -e \'tell application "Crash Reporter" \n quit \n end tell\'');
    child_process.exec('osascript -e \'tell application "Firefox" \n quit \n end tell\'');
    child_process.exec('osascript -e \'tell application "Crash Reporter" \n quit \n end tell\'');
    child_process.exec('osascript -e \'tell application "Firefox" \n quit \n end tell\'');
    child_process.exec('osascript -e \'tell application "Crash Reporter" \n quit \n end tell\'');
    console.log('end terminating firefox');
}

function test_on_firefox() {
    try {
        check_console_output(); // start checking console.txt file periodically
        if (browser_process && !browser_process.killed) {
            //browser_process.kill('SIGKILL');
            terminate_firefox();
        }


        setTimeout(function() {
            child_process.exec('osascript -e \'tell application "Crash Reporter" \n quit \n end tell\'');
            browser_process = child_process.spawn(config['browser_cmd'][current_label], config['browser_arg'][current_label]);
            fs.writeFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/console.txt', '');
            browser_process.stdout.on('data', function(data) {
                fs.appendFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/console.txt', data);
            });

            browser_process.stderr.on('data', function(data) {
                console.log('\tspawn stderr: ' + data);
            });
        }, 1000);
    } catch (ex) {
        console.log(ex);
    }
}


function test_on_chrome_sunspider() {
    var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).build();

    driver.get(config['url'][current_label]);

    var driver_url;
    var result_url;
    var interval_handler = setInterval(function() {
        try {
            console.log('checking result in web page...');
            driver.getCurrentUrl().then(function(url) {
                //console.log(url);
                if (!driver_url) { // if driver_url is empty
                    driver_url = url;
                } else if (driver_url !== url) { // else if the page has been redirected
                    // update the driver object
                    result_url = url;
                    driver.get(result_url);

                    setTimeout(function() { // wait for 3s for the result page to load (in the last round) complete
                        var elem = driver.findElement(webdriver.By.id("jit_final_result"))
                        if (elem) {
                            elem.getInnerHtml().then(function(data) {
                                if (data.indexOf('===experiment done===') >= 0) {
                                    process_record_console_output(data); // record final output to db
                                    clearInterval(interval_handler); // stop this interval checking
                                    driver.quit(); // quit the automated web testing
                                    setTimeout(function() {
                                        start_experiment(); // start next round of experiment
                                    }, 1000);
                                }
                            });
                        } else {
                            console.log('empty');
                        }
                    }, 3000);
                }
            });
        } catch (e) {
            console.log(e);
            console.log('empty');
        }
    }, 6000);
}

function test_on_chrome_octane() {
    var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).build();

    driver.get(config['url'][current_label]);

    var interval_handler = setInterval(function() {
        try {
            console.log('checking result in web page...');
            var elem = driver.findElement(webdriver.By.id("jit_final_result"))
            if (elem) {
                elem.getInnerHtml().then(function(data) {
                    if (data.indexOf('===experiment done===') >= 0) {
                        process_record_console_output(data); // record final output to db
                        clearInterval(interval_handler); // stop this interval checking
                        driver.quit(); // quit the automated web testing
                        setTimeout(function() {
                            start_experiment(); // start next round of experiment
                        }, 1000);
                    }
                });
            } else {
                console.log('empty');
            }
        } catch (e) {
            console.log(e);
            console.log('empty');
        }
    }, 3000);
}

//start another process to monitor the console.txt output, kill firefox at the right time and start the next round of experiment
function check_console_output() {
    var stop = false;
    child_process.exec('osascript -e \'tell application "Crash Reporter" \n quit \n end tell\'');
    console.log('checking console.txt ...');
    try {
        var content = fs.readFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/console.txt', 'utf8');
        if (typeof content === 'string' && content.length > 0) {
            if (content.indexOf('===experiment done===') >= 0) {
                // first close the browser
                if (browser_process) {
                    console.log('kill process');
                    //browser_process.kill('SIGKILL');
                    terminate_firefox();
                } else {
                    console.log('process is undefined');
                }
                process_record_console_output(content);
                fs.unlink(process.cwd() + '/tests/jitaware/experiments/exp_output/console.txt');

                stop = true
                setTimeout(function() {
                    start_experiment(); // start next round of experiment
                }, 3000);
            }
        } else {
            //console.log(JSON.stringify(content));
        }
    } catch (e) {
        console.log('fail to check console output');
        console.log(e);
        // do nothing
    }
    if (!stop) { // stop checking
        setTimeout(check_console_output, 6000); // check it 1s later
    }
}

function process_record_console_output(content) {
    console.log('start processing console output:');
    console.log(content);
    var result = {};
    if (content.indexOf('===sunspider===') >= 0 || content.indexOf('===octane===') >= 0) {
        var lines = content.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var cols = lines[i].split(',');
            if (cols.length == 4) {
                var bench_name = cols[0];
                var avg_time = cols[2];
                result[bench_name] = avg_time;
            }
        }
    } else {
        console.log('!!! unknown format of console.txt');
    }

    add_result_to_csv(result);
}


function add_result_to_csv(result) {
    var all_results = {};
    try {
        var content = fs.readFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/results_db.js');
        all_results = JSON.parse(content);
    } catch (e) {
        // do nothing
    }

    if (!all_results) {
        all_results = {};
    }

    if (!all_results[current_label]) {
        all_results[current_label] = {};
    }

    for (var prop in result) {
        if (result.hasOwnProperty(prop)) {
            if (!all_results[current_label][prop]) {
                all_results[current_label][prop] = [];
            }
            all_results[current_label][prop].push(result[prop]);
        }
    }
    fs.writeFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/results_db.js', JSON.stringify(all_results));
}

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
    fs.writeFileSync(process.cwd() + '/tests/jitaware/experiments/exp_output/result.csv', output.join('\n'));
}