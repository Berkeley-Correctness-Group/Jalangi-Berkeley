#!/bin/bash

rm -rf instrument_for_debugging_tmp
mkdir instrument_for_debugging_tmp
cp $1 instrument_for_debugging_tmp/file.js

cp scripts/debugging_template.html instrument_for_debugging_tmp/index.html

node ../jalangi/src/js/commands/instrument.js --direct_in_output --copy_runtime --smemory --inbrowser --analysis ../jalangi/src/js/analyses/ChainedAnalyses.js --analysis src/js/analyses/dlint/DLintPre.js --analysis src/js/analyses/dlint/UndefinedOffset.js --analysis src/js/analyses/dlint/ShadowProtoProperty.js --analysis src/js/analyses/dlint/CheckNaN.js --analysis src/js/analyses/dlint/DLintPost.js --outputDir instrumented/ instrument_for_debugging_tmp

rm -rf instrument_for_debugging_tmp

