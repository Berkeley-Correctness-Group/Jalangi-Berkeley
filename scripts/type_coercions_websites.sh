#!/bin/bash

dir="type_coercions_results/websites"

rm -rf instrumentFF_tmp
rm -rf ${dir}
mkdir type_coercions_results
mkdir ${dir}
for bm in `cat tests/typeCoercion/urls.txt | xargs`
do
  echo "####################################"
  echo ${bm}
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/WebAppEvaluation/bin/ evaluation.ExperimentRunner --url ${bm}
  bm_short=`basename ${bm}`
  mkdir ${dir}/${bm_short}
  mv /tmp/analysisResults.json ${dir}/${bm_short}/analysisResults.json
  mkdir ${dir}/${bm_short}/sourcemaps
  mv instrumentFF_tmp/*_jalangi_sourcemap.json ${dir}/${bm_short}/sourcemaps/
  mkdir ${dir}/${bm_short}/src
  mv instrumentFF_tmp/*.js ${dir}/${bm_short}/src/
done

