#!/bin/bash

rm -rf instrumentFF_tmp
rm -rf webapps
mkdir webapps
for bm in annex calculator tenframe todolist 
do
  echo "####################################"
  echo ${bm}
  java -cp thirdparty/selenium-server-standalone-2.41.0.jar:/home/m/eclipse/workspace/WebAppEvaluation/bin/ evaluation.ExperimentRunner ${bm}
  mkdir webapps/${bm}
  mv /tmp/analysisResults.json webapps/${bm}/analysisResults.json
  mkdir webapps/${bm}/src
  mv instrumentFF_tmp/*.js webapps/${bm}/src/
done


