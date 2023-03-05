#!/bin/zsh

#
# $> ./preplot.sh input.svg output.svg
#
# $1 -> input SVG filename
# $2 (optional) -> output SVG filename; default: occ.svg
#

if [[ $1 ]] then
  if [[ $2 ]] then
    FILE=$2
  else
    FILE="occ.svg"
  fi

  echo "Processing..."

  # Note: I can't decide if `splitall` creates better blobs or not

  # IGNORE LAYERS
  # vpype -v read $1 reloop linemerge linesimplify occult -i -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE

  # IGNORE LAYERS AND DON'T LAYER SORT
  # vpype -v read $1 reloop linemerge linesimplify occult -i linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE
  
  # RESPECT LAYERS
  vpype -v read --attr fill $1 splitall reloop linemerge linesimplify occult -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE
  
  echo "Done."
  echo "Opening $FILE..."

  open $FILE
else
  echo "Missing expected parameter.\n"
  echo "Usage:"
  echo "$> ./preplot.sh input.svg output.svg"
fi