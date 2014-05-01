#!/bin/bash

node ../jalangi/src/js/commands/instrument.js --copy_runtime --smemory --inbrowser --analysis src/js/analyses/CommonUtil.js:src/js/analyses/inconsistentType/TypeAnalysis.js:src/js/analyses/inconsistentType/InconsistentTypeEngine.js --outputDir instrumented/ tests/inconsistentType/
