/*
 * Copyright (c) 2014, University of California, Berkeley
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
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

/*
 $ node stat result.txt result.csv
 get parameters from process.argv
 0: node
 1: stat
 2: result.txt
 3: result.csv
 */

/*
 var titles = ['data_name', 'algorithm',
 'total_time', 'total_time_count',
 'bdd_time', 'bdd_time_count',
 'solver_time', 'solver_time_count',
 'within_theory_assign', 'outside_theory_assign',
 'op_num','multiex_op_num',
 //'op_num_reexecute',
 'solver_call_num', 'sat_num', 'unsat_num',
 'dse_input_num', 'multiex_input_num',
 'solver_cache_hit_num',
 'avg_vs_size', 'max_vs_size', 'min_vs_size',
 'avg_pv_ratio', 'max_pv_ratio', 'min_pv_ratio',
 'speedup'];

 var titles_full = ['dataset', 'algorithm',
 'Time spent in total (ms)', 'Time spent in total (count)',
 'Time spent in bdd (ms)', 'Time spent in bdd (count)',
 'Time spent in solver (ms)', 'Time spent in solver (count)',
 'Number of within theory assignments', 'Number of outside theory assignments',
 'Number of operations', 'Number of multiex operations',
 'Number of solver calls', 'Number of sat', 'Number of unsat',
 'Number of DSE inputs', 'Number of MULTIEX inputs',
 'Number of solver cache hit',
 'average value summary size', 'maximum value summary size', 'minimum value summary size',
 'average paths to value ratio', 'maximum paths to value ratio', 'minimum paths to value ratio',
 'DSE/Multiex total time speedup'];
 */

/*
 var titles_full = ['Name', 'Algorithm', 'Total Time (ms)', 'BDD Time (ms)',
 'Solver Time (ms)', '\\# within Theory Assign', '\\# outside Theory Assign',
 '\\# Operations', '\\# \\tool{} Operations', '\\# Solver Calls',
 '\\# \\tool{} Inputs',
 'Avg Value Summary Size', 'Max Value Summary Size', 'Min Value Summary Size',
 'Avg Paths to Value Ratio', 'Max Paths to Value Ratio', 'Min Paths to Value Ratio', 'Total Time Speedup'];
 */


var titles = ['data_name', 'loc',
    'runtime',
    'slowdown',
    'hc_num',
    'undef_array_access_num',
    'switch_array_type_num',
    'noncont_array_num',
    'nonconstructor_num',
    'binary_num',
    'polyfun_num',
    'argleak_num',
    'typedarray_num'
    ];

var titles_full = ['Benchmark', 'LOC',
    'Runtime (s)',
    'Slowdown',
    'Inline cache miss',
    'Undefined array element',
    'Swtich array type',
    'Non-contiguous array key',
    'Init fields outside constructor',
    'Binary operation on undefined',
    'Polymorphic function call',
    'arguments leaking',
    'typed array'
    ];

function createRow() {
    return {
        data_name: 0,
        loc: 0,
        runtime: 0,
        slowdown: 0,
        originaltime: 0,
        hc_num: 0,
        undef_array_access_num: 0,
        switch_array_type_num: 0,
        noncont_array_num: 0,
        nonconstructor_num: 0,
        binary_num: 0,
        polyfun_num: 0,
        argleak_num: 0,
        typedarray_num: 0
    };
}

var currentRow = null;
var current_state = 1;

var table = null;
function createTable() {
    table = [];
    table.push(titles_full.join(','));
}

function dumpTableToString() {
    return table.join('\r\n');
}

var count = 0;
var lastTotalTime = 0;

function formatCell(value) {
    var val = parseFloat(value);
    if(isNaN(val)) {
        /*if(value === null) {
         return '$\\varnothing$';
         }*/
        return value;
    }
    return val;
}

function appendRow(row) {
    currentRow.slowdown = currentRow.runtime/currentRow.originaltime;

    var row_str = '';
    for (var i=0;i<titles.length;i++) {
        var value = formatCell(currentRow[titles[i]]);
        row_str += value + ',';
    }
    table.push(row_str);
}

var fs = require('fs'),
    readline = require('readline');
createTable();

// read content from the file
var rd = readline.createInterface({
    input: fs.createReadStream(process.argv[2]),
    output: process.stdout,
    terminal: false
});

// process the content line by line
rd.on('line', function(line) {
    //console.log(line);
    process_line(line);
});


/*
     [**name**]Octane-Splay
     [****]loc:  395 ../jalangi/tests/octane/splay.js
     ---- Instrumenting /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay ----
     node /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/src/js/instrument/esnstrument.js --initIID /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js
     ---- Analyzing /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay directly ----
     node /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/src/js/commands/direct.js --smemory --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/src/js/analyses/ChainedAnalyses.js --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/utils/Utils.js --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/utils/RuntimeDB.js --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/TrackHiddenClass --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/AccessUndefArrayElem --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/SwitchArrayType --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/NonContiguousArray --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/InitFieldOutsideConstructor --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/BinaryOpOnUndef --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/PolymorphicFunCall --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/ArgumentsLeak --analysis /Users/jacksongl/macos-workspace/research/jalangi/github_jit/Jalangi-Berkeley/src/js/analyses/jitaware/chaining/TypedArray /Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay_jalangi_.js
     [****]time: 0.7451450824737549s



     ---------------------------
     Created 24 hidden classes.

     property access at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:303:15) has missed cache 270 time(s).
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:159:22) 22 time(s)
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:168:18) 682 time(s)
     layout [__proto__:f4|key:n|value:n|]:
     put field: key observed 1 time(s)
     layout [__proto__:f4|key:n|value:n|left:n|right:n|]:
     put field: key observed 299 time(s)
     layout [__proto__:f4|key:n|value:n|right:n|left:n|]:
     put field: key observed 404 time(s)
     property access at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:321:22) has missed cache 156 time(s).
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:159:22) 11 time(s)
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:168:18) 363 time(s)
     layout [__proto__:f4|key:n|value:n|]:
     put field: key observed 1 time(s)
     layout [__proto__:f4|key:n|value:n|left:n|right:n|]:
     put field: key observed 137 time(s)
     layout [__proto__:f4|key:n|value:n|right:n|left:n|]:
     put field: key observed 236 time(s)
     property access at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:304:12) has missed cache 129 time(s).
     accessed property "left" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:159:22) 11 time(s)
     accessed property "left" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:168:18) 319 time(s)
     layout [__proto__:f4|key:n|value:n|left:n|right:n|]:
     put field: left observed 162 time(s)
     layout [__proto__:f4|key:n|value:n|right:n|left:n|]:
     put field: left observed 168 time(s)
     property access at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:322:12) has missed cache 152 time(s).
     accessed property "right" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:159:22) 10 time(s)
     accessed property "right" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:168:18) 348 time(s)
     layout [__proto__:f4|key:n|value:n|]:
     put field: right observed 1 time(s)
     layout [__proto__:f4|key:n|value:n|left:n|right:n|]:
     put field: right observed 130 time(s)
     layout [__proto__:f4|key:n|value:n|right:n|left:n|]:
     put field: right observed 227 time(s)
     property access at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:325:17) has missed cache 131 time(s).
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:159:22) 12 time(s)
     accessed property "key" of object created at (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:168:18) 280 time(s)
     layout [__proto__:f4|key:n|value:n|left:n|right:n|]:
     put field: key observed 136 time(s)
     layout [__proto__:f4|key:n|value:n|right:n|left:n|]:
     put field: key observed 156 time(s)
     [****]HiddenClass: 5
     ---------------------------
     Report of loading undeclared or deleted array elements:
     ...
     Number of loading undeclared or deleted array elements spotted: 0
     [****]AccessUndefArrayElem: 0
     ---------------------------
     Report of switching array type
     ...
     Number of switching array type spotted: 0
     [****]SwitchArrayType: 0
     ---------------------------
     Report of making non-contiguous array:
     ...
     Number of putting non-contiguous array statements: 0
     [****]NonContArray: 0
     Why: In order to handle large and sparse arrays, there are two types of array storage internally:
     * Fast Elements: linear storage for compact key sets
     * Dictionary Elements: hash table storage otherwise
     It's best not to cause the array storage to flip from one type to another.
     ---------------------------
     Report of initialize object field in non-constructor:
     * [location: (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:336:7)] <- No. usages: 134
     * [location: (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:318:7)] <- No. usages: 130
     Number of statements init objects in non-constructor: 2
     [****]Nonconstructor: 2
     ---------------------------
     Report of binary operation on undefined value:
     Number of statements that perform binary operation on undefined values: 0
     [****]BinaryOpUndef: 0
     ---------------------------
     Report of polymorphic function call:
     Number of polymorphic function call: 0
     [****]PolyFun: 0
     ---------------------------
     Report of arguments leaking:
     Number of statements that leaks arguments object: 0
     [****]ArgLeak: 0
     gathering data...
     -------------Fix Array Refactor Report-------------
     Array created at the following locations may be special-typed:
     location: (/Users/jacksongl/macos-workspace/research/jalangi/github_jit/jalangi/tests/octane/splay.js:49:16)
     [Oper-Count]:	2816
     [READONLY]
     [****]typedArray: 1
     ---------------------------------------------------
     Following arrays can not be typed:

     None
     real	0m0.049s
     user	0m0.039s
     sys	0m0.011s
     [*]exp-done

 */


function process_line(line) {
    var res_array;

    // match [**name**]Octane-Splay
    res_array = /\[\*\*name\*\*\](.*)/.exec(line);
    if(res_array) {
        if(currentRow) {
            appendRow(currentRow);
        }
        currentRow = createRow();
        currentRow.data_name = res_array[1];
        return ;
    }

    // match [*]exp-done
    res_array = /\[\*\]exp-done/.exec(line);
    if(res_array) {
        appendRow(currentRow);
        // dump information to string
        var result = dumpTableToString();
        var output_file = process.argv[3];
        fs.writeFileSync(output_file, result);
        console.log();
        console.log(result);
        return ;
    }

    // match [****]time: 0.7792110443115234s
    res_array = /\[\*\*\*\*\]time: (\d+(\.\d+)*)/.exec(line);
    if(res_array) {
        currentRow.runtime = res_array[1];
        return ;
    }

    // match [****]loc: 123
    res_array = /\[\*\*\*\*\]loc:\s*(\d+)/.exec(line);
    if(res_array) {
        currentRow.loc = res_array[1];
        return ;
    }

    /*
    match:
     real	0m0.047s
     user	0m0.038s
     sys	0m0.012s
    */
    res_array = /real[\s]*((\d+)m)?(\d+(\.\d+)?)s/.exec(line);
    if(res_array) {
        var m = res_array[2];
        var s = res_array[3];
        currentRow.originaltime = m*60 + parseFloat(s);
        return ;
    }

    res_array = /sys[\s]*((\d+)m)?(\d+(\.\d+)?)s/.exec(line);
    if(res_array) {
        //var m = res_array[2];
        //var s = res_array[3];
        //currentRow.total_time = m*60 + parseFloat(s);
        return ;
    }

    res_array = /user[\s]*((\d+)m)?(\d+(\.\d+)?)s/.exec(line);
    if(res_array) {
        //var m = res_array[2];
        //var s = res_array[3];
        //currentRow.total_time = m*60 + parseFloat(s);
        return ;
    }


    // [****]HiddenClass: 5
    res_array = /\[\*\*\*\*\]HiddenClass: (\d+)/.exec(line);
    if(res_array) {
        currentRow.hc_num = res_array[1];
        return ;
    }

    // [****]AccessUndefArrayElem: 0
    res_array = /\[\*\*\*\*\]AccessUndefArrayElem: (\d+)/.exec(line);
    if(res_array) {
        currentRow.undef_array_access_num = res_array[1];
        return ;
    }

    // [****]SwitchArrayType: 0
    res_array = /\[\*\*\*\*\]SwitchArrayType: (\d+)/.exec(line);
    if(res_array) {
        currentRow.switch_array_type_num = res_array[1];
        return ;
    }

    // [****]NonContArray: 0
    res_array = /\[\*\*\*\*\]NonContArray: (\d+)/.exec(line);
    if(res_array) {
        currentRow.noncont_array_num = res_array[1];
        return ;
    }

    // [****]Nonconstructor: 0
    res_array = /\[\*\*\*\*\]Nonconstructor: (\d+)/.exec(line);
    if(res_array) {
        currentRow.nonconstructor_num = res_array[1];
        return ;
    }

    // [****]BinaryOpUndef: 0
    res_array = /\[\*\*\*\*\]BinaryOpUndef: (\d+)/.exec(line);
    if(res_array) {
        currentRow.binary_num = res_array[1];
        return ;
    }

    // [****]PolyFun: 0
    res_array = /\[\*\*\*\*\]PolyFun: (\d+)/.exec(line);
    if(res_array) {
        currentRow.polyfun_num = res_array[1];
        return ;
    }

    // [****]ArgLeak: 0
    res_array = /\[\*\*\*\*\]ArgLeak: (\d+)/.exec(line);
    if(res_array) {
        currentRow.argleak_num = res_array[1];
        return ;
    }

    // [****]typedArray: 0
    res_array = /\[\*\*\*\*\]typedArray: (\d+)/.exec(line);
    if(res_array) {
        currentRow.typedarray_num = res_array[1];
        return ;
    }

    //console.log(' **** unmatched line ****');
    //console.log(line);
}