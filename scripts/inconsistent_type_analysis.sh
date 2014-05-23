#!/bin/bash

node src/js/analyses/inconsistentType/Preprocessor.js $1 $1_beliefs_.js

python ../jalangi/scripts/jalangi.py direct -a src/js/analyses/inconsistentType/InconsistentTypeEngine.js $1_beliefs_
