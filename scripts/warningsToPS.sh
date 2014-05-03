#!/bin/bash

if [ -e jalangi_types.dot ]; then
  dot -Tps jalangi_types.dot > jalangi_types.ps
fi
for f in `ls  warning*.dot | xargs`
do
  dot -Tps ${f} > ${f}.ps
done

if [ -d jalangi_tmp ]; then
  cd jalangi_tmp
  for f in `ls warning*.dot | xargs`
  do
    dot -Tps ${f} > ${f}.ps
  done
  dot -Tps jalangi_types.dot > jalangi_types.ps
  cd ..
fi
