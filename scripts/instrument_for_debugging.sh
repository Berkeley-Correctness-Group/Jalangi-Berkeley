#!/bin/bash

node ../jalangi/src/js/commands/instrument.js --copy_runtime --smemory --inbrowser --analysis src/js/analyses/CommonUtil.js --analysis src/js/analyses/inconsistentType/TypeAnalysis.js --analysis src/js/analyses/inconsistentType/InconsistentTypeEngine.js --outputDir instrumented/ tests/inconsistentType/
