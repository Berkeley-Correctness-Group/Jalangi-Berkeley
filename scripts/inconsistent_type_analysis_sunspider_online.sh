#!/bin/bash

for bm in `ls ../jalangi/tests/sunspider1/*.js | grep -v "_jalangi_" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm}`
  node src/js/commands/transform_analyze.js ../jalangi ${bm} src/js/analyses/inconsistentType/InconsistentTypeEngine /tmp/maxIIDs.json
  mv analysisResults.json ${bm_short}_analysisResults.json
  mv ../jalangi/jalangi_sourcemap.json ${bm_short}_sourcemap.json
done


