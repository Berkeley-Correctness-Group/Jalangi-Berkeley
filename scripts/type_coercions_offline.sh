#!/bin/bash

node --max-old-space-size=2048 src/js/analyses/typeCoercion/OfflineAnalysis3.js 0 &> out_offline_0 &
node --max-old-space-size=2048 src/js/analyses/typeCoercion/OfflineAnalysis3.js 1 &> out_offline_1 &
node --max-old-space-size=2048 src/js/analyses/typeCoercion/OfflineAnalysis3.js 2 &> out_offline_2 &
node --max-old-space-size=2048 src/js/analyses/typeCoercion/OfflineAnalysis3.js 3 &> out_offline_3 &

FAIL=0
for job in `jobs -p`
do
echo $job
    wait $job || let "FAIL+=1"
done

if [ "$FAIL" == "0" ];
then
echo "DONE :-)"
else
echo "FAIL! ($FAIL)"
fi
