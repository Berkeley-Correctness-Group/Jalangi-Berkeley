#!/bin/bash

# argument: directory with results (each subdir = one benchmark)

for bm in `ls $1 | xargs`
do
  echo $bm
  wc -l `find $1/${bm}/src/ -name "*.js" -not -name "*_jalangi_*" | xargs`
  echo
done
