#!/bin/bash

rm -f filterAndMergeConfig.json
for b in `ls webapps/ | xargs`
do
  node src/js/analyses/inconsistentType/OfflineAnalysis.js webapps/${b}
done
