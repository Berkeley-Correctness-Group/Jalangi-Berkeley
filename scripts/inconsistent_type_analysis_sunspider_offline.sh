#!/bin/bash

rm -f filterAndMergeConfig.json
for b in `ls sunspider/ | xargs`
do
  node src/js/analyses/inconsistentType/OfflineAnalysis.js sunspider/${b}
done
