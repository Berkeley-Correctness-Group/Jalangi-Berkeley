#!/bin/bash

for dir in sunspider octane webapps
do
  echo
  echo "@@@@@@@@ =================== ${dir}"
  cd ${dir}
  for bm in `ls | xargs`
  do
    echo
    echo "################### ${bm} ########################"
    cd ${bm}/src
    echo `pwd`
    cloc `ls | grep -v "_jalangi_" | grep -v "jquery\|mootools\|bootstrap\|peg-0.6.2\|date.js\|less-1.2.0\|interactions.js\|yui\|tinymce" | xargs`
    echo
    cd ../..
  done
  cd ..
done
