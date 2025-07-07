#!/bin/zsh

#
# $> ./preplot.sh input.svg output.svg
#
# $1 -> input SVG filename
# $2 (optional) -> output SVG filename; default: occ.svg
#

if [[ $1 ]] then
  IN_FILE="$1"
  # IN_FILE=$(printf '%q' "$1")
  if [[ $2 ]] then
    FILE=$(printf '%q' "$2")
  else
    FILE="occ.svg"
  fi

  echo "Processing $IN_FILE..."

  # IGNORE LAYERS
  # vpype -v read $1 reloop linemerge linesimplify occult -i -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE

  # IGNORE LAYERS AND DON'T LAYER SORT
  # vpype -v read $1 reloop linemerge linesimplify occult -i linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE
  
  # RESPECT LAYERS
  # vpype -v read --attr fill $1 reloop linemerge linesimplify occult -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE

  #
  # CONFIGURATION
  #
  # -v: Just gives a verbose output (interesting but not required)
  # read --attr fill: organize layers by fill colour so that they
  # reloop: adjust where the blobs end so there's less regularity in the drawing start point
  # occult -i -r: perform occlusion across all layers (-i) and reverse the node order within layers (-r)
  # layout ...: self explanatory
  # filter: remove any small lines that are shorter than 0.05mm
  # write -f svg: write the output to an SVG file

  # HELPER
  #
  # This is a shortcut to feed the most recently downloaded SVG into this pipeline:
  # $> ls -t ~/Downloads/*.svg | head -1 | xargs ./preplot.sh
  # To allow for filenames that include escape characters (like spaces) to be consumed by `xargs`, do this:
  # $> \ls -t ~/Downloads/*.svg | head -1 | tr \\n \\0 | xargs -0 ./preplot.sh

  vpype \
    read --attr fill \
    $IN_FILE \
    reloop \
    occult -i -r \
    layout --align center --valign center --fit-to-margins 0.05in 8.5inx8.5in \
    filter --min-length 0.05mm \
    write -f svg $FILE
  
  echo "Done."
  echo "Opening $FILE..."

  open $FILE
else
  echo "Missing expected parameter.\n"
  echo "Usage:"
  echo "$> ./preplot.sh input.svg output.svg"
fi