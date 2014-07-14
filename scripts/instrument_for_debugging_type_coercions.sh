#!/bin/bash

rm -rf instrument_for_debugging_tmp
mkdir instrument_for_debugging_tmp
cp $1 instrument_for_debugging_tmp/file.js

cp scripts/debugging_template.html instrument_for_debugging_tmp/index.html

node ../jalangi/src/js/commands/instrument.js --direct_in_output --copy_runtime --smemory --inbrowser --analysis src/js/analyses/CommonUtil.js --analysis src/js/analyses/typeCoercion/TypeAnalysisEngine3.js --outputDir instrumented/ instrument_for_debugging_tmp

rm -rf instrument_for_debugging_tmp

