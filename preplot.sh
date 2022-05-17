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

  # Note: I removed `splitall` from the pipeline because the blobs are better maintained and occluded without it
  vpype -v read --attr fill $1 reloop linemerge linesimplify occult -i -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE
  # vpype -v read --attr fill $1 reloop linemerge linesimplify occult -r linesort layout --align center --valign center --fit-to-margins 0.05in 5.5inx8.5in filter --min-length 1mm write -f svg $FILE
  
  echo "Done."
  echo "Opening $FILE..."

  open $FILE
else
  echo "Missing expected parameter.\n"
  echo "Usage:"
  echo "$> ./preplot.sh input.svg output.svg"
fi