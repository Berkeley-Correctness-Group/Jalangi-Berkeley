#!/bin/bash

dot -Tps jalangi_types.dot > jalangi_types.ps
for f in `ls  warning*.dot | xargs`
do
  dot -Tps ${f} > ${f}.ps
done

