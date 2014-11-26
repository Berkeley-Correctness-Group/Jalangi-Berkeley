#!/bin/bash

dir="type_coercions_results/webapps"

rm -rf instrumentFF_tmp
rm -rf ${dir}
mkdir type_coercions_results
mkdir ${dir}
for bm in annex calculator tenframe todolist joomla-admin moodle zurmo 
do
  echo "####################################"
  echo ${bm}
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/WebAppEvaluation/bin/ evaluation.ExperimentRunner ${bm}
  mkdir ${dir}/${bm}
  mv /tmp/analysisResults.json ${dir}/${bm}/analysisResults.json
  mkdir ${dir}/${bm}/sourcemaps
  mv instrumentFF_tmp/*_jalangi_sourcemap.json ${dir}/${bm}/sourcemaps/
  mkdir ${dir}/${bm}/src
  mv instrumentFF_tmp/*.js ${dir}/${bm}/src/
done


