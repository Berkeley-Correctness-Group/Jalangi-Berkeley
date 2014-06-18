#!/bin/bash

rm -f filterAndMergeConfig.json
for b in `ls octane/ | xargs`
do
  node src/js/analyses/inconsistentType/OfflineAnalysis.js octane/${b}
done
