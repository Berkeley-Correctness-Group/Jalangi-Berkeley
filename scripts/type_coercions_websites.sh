#!/bin/bash

rm -rf instrumentFF_tmp
rm -rf websites
mkdir websites
for bm in `cat tests/typeCoercion/urls.txt | xargs`
do
  echo "####################################"
  echo ${bm}
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/WebAppEvaluation/bin/ evaluation.ExperimentRunner --url ${bm}
  bm_short=`basename ${bm}`
  mkdir websites/${bm_short}
  mv /tmp/analysisResults.json websites/${bm_short}/analysisResults.json
  mkdir websites/${bm_short}/sourcemaps
  mv instrumentFF_tmp/*_jalangi_sourcemap.json websites/${bm_short}/sourcemaps/
  mkdir websites/${bm_short}/src
  mv instrumentFF_tmp/*.js websites/${bm_short}/src/
done

