#!/bin/bash

dir="type_coercions_results/tests"
rm -rf ${dir}
mkdir type_coercions_results
mkdir ${dir}

for bm in `ls ./tests/typeCoercion/*.js | grep -v "_jalangi_" | xargs`
do
  echo "####################################"
  echo ${bm}
  bm_short=`basename ${bm}`
  bm_no_ext=`echo ${bm} | sed -s 's/.js$//'`
  ./scripts/type_coercions.sh ${bm_no_ext}
  mkdir ${dir}/${bm_short}
  mv jalangi_tmp/analysisResults.json ${dir}/${bm_short}/analysisResults.json
  mkdir ${dir}/${bm_short}/sourcemaps
  mv jalangi_tmp/jalangi_sourcemap.json ${dir}/${bm_short}/sourcemaps/sourcemap.json
  mkdir ${dir}/${bm_short}/src
  cp ${bm} ${dir}/${bm_short}/src/
done


