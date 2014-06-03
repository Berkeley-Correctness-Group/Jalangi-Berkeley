#!/bin/bash

rm -rf instrumentFF_tmp
rm -rf webapps
mkdir webapps
for bm in "joomla"
do
  echo "####################################"
  echo ${bm}
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/JalangiWebAppEvaluation/bin/ evaluation.ExperimentRunner ${bm}
  mkdir webapps/${bm}
  mv /tmp/analysisResults.json webapps/${bm}/analysisResults.json
  mkdir webapps/${bm}/sourcemaps
  mv instrumentFF_tmp/*_jalangi_sourcemap.json webapps/${bm}/sourcemaps/
  mkdir webapps/${bm}/src
  mv instrumentFF_tmp/*.js webapps/${bm}/src/
done


