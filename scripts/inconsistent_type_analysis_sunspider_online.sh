#!/bin/bash

for bm in `ls ../jalangi/tests/sunspider1/*.js | grep -v "_jalangi_" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm}`
  bm_no_ext=`echo ${bm} | sed 's/.js$//'`
  python ../jalangi/scripts/jalangi.py direct -a src/js/analyses/inconsistentType/InconsistentTypeEngine.js ${bm_no_ext}
  mv jalangi_tmp/analysisResults.json ${bm_short}_analysisResults.json
  mv jalangi_tmp/jalangi_sourcemap.json ${bm_short}_sourcemap.json
done


