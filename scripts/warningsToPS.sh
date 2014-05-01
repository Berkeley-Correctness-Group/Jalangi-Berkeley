#!/bin/bash

dot -Tps jalangi_types.dot > jalangi_types.ps
for f in `ls  warning*.dot | xargs`
do
  dot -Tps ${f} > ${f}.ps
done

dot -Tps jalangi_tmp/jalangi_types.dot > jalangi_tmp/jalangi_types.ps
