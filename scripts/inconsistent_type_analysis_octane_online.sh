#!/bin/bash

rm -rf /tmp/jalangiWorkingDir/*
rm -rf octane
mkdir octane
for bm in `ls -1 tests/octane2/index_*.html | grep -e "box2d\|code-load\|crypto\|deltablue\|earley-boyer" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm} | sed -e 's/index_//g' | sed -e 's/.html//g'`
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/JalangiWebAppEvaluation/bin/ evaluation.OctaneExperimentRunner ${bm_short}
  mkdir octane/${bm_short}
  mv /tmp/analysisResults.json octane/${bm_short}/analysisResults.json
  mkdir octane/${bm_short}/sourcemaps
  mv /tmp/jalangiWorkingDir/*_jalangi_sourcemap.json octane/${bm_short}/sourcemaps/
  mkdir octane/${bm_short}/src
  mv /tmp/jalangiWorkingDir/*.js octane/${bm_short}/src/
done


