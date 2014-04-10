#!/bin/bash

node ../jalangi/src/js/commands/instrumentDir.js --copy_runtime --jalangi_root ../jalangi --relative --inbrowser --analysis src/js/analyses/inconsistentType/InconsistentTypeEngine.js tests/inconsistentType/ instrumented/
