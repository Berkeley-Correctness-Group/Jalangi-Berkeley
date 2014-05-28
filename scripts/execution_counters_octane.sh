#!/bin/bash

rm -rf instrumentFF_tmp
rm -rf octane_execution_counters
mkdir octane_execution_counters
for bm in `ls -1 tests/octane2/index_*.html | grep -v -e "typescript\|zlib" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm} | sed -e 's/index_//g' | sed -e 's/.html//g'`
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/JalangiWebAppEvaluation/bin/ evaluation.OctaneExperimentRunner ${bm_short}
  mkdir octane_execution_counters/${bm_short}
  mv /tmp/analysisResults.json octane_execution_counters/${bm_short}/analysisResults.json
done


