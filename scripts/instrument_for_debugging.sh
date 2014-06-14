#!/bin/bash

rm -rf instrument_for_debugging_tmp
mkdir instrument_for_debugging_tmp
cp $1 instrument_for_debugging_tmp/file.js

node src/js/analyses/inconsistentType/Preprocessor.js instrument_for_debugging_tmp/file.js instrument_for_debugging_tmp/file_beliefs_.js

cp scripts/debugging_template.html instrument_for_debugging_tmp/index.html

node ../jalangi/src/js/commands/instrument.js --direct_in_output --copy_runtime --smemory --inbrowser --analysis src/js/analyses/CommonUtil.js --analysis src/js/analyses/inconsistentType/TypeUtil.js --analysis src/js/analyses/inconsistentType/BenchmarkHelper.js --analysis src/js/analyses/inconsistentType/CallGraph.js --analysis src/js/analyses/inconsistentType/FilterAndMerge.js --analysis src/js/analyses/inconsistentType/TypeAnalysis.js --analysis src/js/analyses/inconsistentType/InconsistentTypeEngine.js --outputDir instrumented/ instrument_for_debugging_tmp

rm -rf instrument_for_debugging_tmp

