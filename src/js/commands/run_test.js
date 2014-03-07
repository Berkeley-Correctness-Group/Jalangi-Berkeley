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
// node src/js/commands/run_test.js <program to be instrumented> <analysis code>
// Example:
// node src/js/commands/run_test.js jalangi_home/tests/octane/pdfjs.js src/js/analyses/jitaware/JITAware.js

var exec = require('child_process').exec;
var child;
var cur_dir = process.cwd();
var path = require('path');

if(process.argv.length !== 5) {
	console.log('\r\n' + 
		        ' * Command Line Usage: \r\n' + 
				' * 	node src/js/commands/run_test.js <jalangi homepath> <program to be instrumented> <analysis code>\r\n' + 
				' * Example:\r\n' + 
				' * 	node src/js/commands/run_test.js jalangi_home jalangi_home/tests/octane/pdfjs.js src/js/analyses/jitaware/JITAware.js\r\n');
	return;
}

var inst_start_time, inst_end_time;
var run_start_time, run_end_time;

// process.argv[0] -> node
// process.argv[1] -> run_test.js
// process.argv[2] -> jalangi_home dir
// process.argv[3] -> program to be instrumented
// process.argv[4] -> analysis code
var jalangi_home_dir = path.resolve(process.cwd() + '/' + process.argv[2]);
var target_file = path.resolve(process.cwd() + '/' + process.argv[3]);
var clientAnalysis = path.resolve(process.cwd() + '/' + process.argv[4])
var inst_file = target_file.substring(0, target_file.lastIndexOf('.js')) + '_jalangi_.js';


// instrument the target code
inst_start_time = new Date();
var inst_comm = 'node src/js/instrument/esnstrument.js ' + target_file;
console.log('instrumenting target: ' + target_file);
console.log('please wait, it may take a while...');
child = exec(inst_comm, {cwd: jalangi_home_dir}, function (error, stdout, stderr) {
  if (error !== null) {
    console.log('exec error: ' + error);
  } else {
  	inst_end_time = new Date();
  	console.log('instrumentation complete (' + ((inst_end_time - inst_start_time)/1000) + 's)');
  	console.log('writing into file: ' + inst_file);
  	console.log('start running instrumented code with analysis code:');
  	console.log('--------------------------------------');
    run_start_time = new Date();
  	run_inst_with_analysis();
  }
});

function run_inst_with_analysis(){
	var analysis = require(jalangi_home_dir + '/src/js/analysis');
	analysis.init("inbrowser", clientAnalysis);
	require(jalangi_home_dir + '/src/js/InputManager');
	require(jalangi_home_dir + '/src/js/instrument/esnstrument');
	require(jalangi_home_dir + '/inputs.js');
	require(jalangi_home_dir + '/jalangi_sourcemap.js');
	var script = inst_file;
	require(path.resolve(script));
	J$.endExecution();
    run_end_time = new Date();
    console.log('total seconds: ' + (run_end_time - run_start_time)/1000);
}