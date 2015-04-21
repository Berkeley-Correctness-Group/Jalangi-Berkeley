#!/bin/sh

for f in `ls  *.plot | xargs`
do
        gnuplot $f
done

for f in `ls *.eps | xargs`
do
        epstopdf $f
done

## special case:
pdfcrop consistency_at_location.pdf
