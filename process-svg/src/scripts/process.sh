#!/bin/bash

basedir=$1
filename=$2
size=$3

echo "$(date -u) - Start processing $size/$filename" >> $basedir/$filename.log 2>&1
start_time="$(date -u +%s)"

echo "[step 1/4] inkscape"
inkscape -V
inkscape -b white -w 2048 -h 2048 $basedir/$filename -o $basedir/inkscape_$filename.png

echo "[step 2/5] imagemagick"
convert -version
convert $basedir/inkscape_$filename.png $basedir/imagemagick_$filename.pnm

echo "[step 3/5] potrace"
potrace -v
potrace $basedir/imagemagick_$filename.pnm -s -o $basedir/potrace_$filename

echo "[step 4/5] rsvg-convert"
rsvg-convert -v
dpi="$((90/24*$size))"
rsvg-convert -w $size -h $size --keep-aspect-ratio --dpi-x $dpi --dpi-y $dpi -f svg $basedir/potrace_$filename -o $basedir/rsvg_$filename

echo "[step 5/5] svgo"
npx svgo $basedir/rsvg_$filename -o $basedir/svgo_$filename

sed -r 's/\#000/currentColor/g' $basedir/svgo_$filename > $basedir/$filename

end_time="$(date -u +%s)"
elapsed="$(($end_time-$start_time))"
echo "$(date -u) - End processing $size/$filename in $elapsed seconds" >> $basedir/$filename.log 2>&1