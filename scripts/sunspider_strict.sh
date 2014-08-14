#!/bin/bash

for bm in `ls ../jalangi/tests/sunspider1/*.js | grep -v "_jalangi_" | xargs`
do
  echo "####################################"
  echo ${bm}
  node ${bm} &> out_normal
  node --use_strict ${bm} &> out_strict
  diff out_normal out_strict
done

rm out_normal
rm out_strict

