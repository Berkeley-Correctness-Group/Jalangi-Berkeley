#!/bin/bash

rm -rf sunspider
mkdir sunspider
for bm in `ls ../jalangi/tests/sunspider1/*.js | grep -v "_jalangi_" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm}`
  bm_no_ext=`echo ${bm} | sed -s 's/.js$//'`
  ./scripts/type_coercions.sh ${bm_no_ext}
  mkdir sunspider/${bm_short}
  mv jalangi_tmp/analysisResults.json sunspider/${bm_short}/analysisResults.json
  mkdir sunspider/${bm_short}/sourcemaps
  mv jalangi_tmp/jalangi_sourcemap.json sunspider/${bm_short}/sourcemaps/sourcemap.json
  mkdir sunspider/${bm_short}/src
  cp ${bm} sunspider/${bm_short}/src/
done


