#!/bin/bash

rm -rf instrumentFF_tmp
rm -rf octane
mkdir octane
for bm in `ls -1 tests/octane2/index_*.html | grep -v -e "zlib\|typescript\|earley-boyer\|code-load" | xargs`  # exclude benchmarks with generated or obfuscated code
#for bm in `ls -1 tests/octane2/index_*.html | xargs`  # all benchmarks
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm} | sed -e 's/index_//g' | sed -e 's/.html//g'`
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/WebAppEvaluation/bin/ evaluation.OctaneExperimentRunner ${bm_short}
  mkdir octane/${bm_short}
  mv /tmp/analysisResults.json octane/${bm_short}/analysisResults.json
  mkdir octane/${bm_short}/sourcemaps
  mv instrumentFF_tmp/*_jalangi_sourcemap.json octane/${bm_short}/sourcemaps/
  mkdir octane/${bm_short}/src
  mv instrumentFF_tmp/*.js octane/${bm_short}/src/
done

