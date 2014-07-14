#!/bin/bash

python ../jalangi/scripts/jalangi.py direct -a ../jalangi/src/js/analyses/ChainedAnalyses.js -a src/js/analyses/dlint/DLintPre.js -a src/js/analyses/dlint/UndefinedOffset.js -a src/js/analyses/dlint/ShadowProtoProperty.js -a src/js/analyses/dlint/CheckNaN.js -a src/js/analyses/dlint/DLintPost.js $1
