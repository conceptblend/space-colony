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

  # vpype -v read --attr fill $1 reloop splitall linemerge linesimplify occult -i -r linesort write -f svg -p letter -l -c $FILE
  vpype -v read --attr fill $1 reloop splitall linemerge linesimplify occult -i -r linesort layout --align center --valign center --fit-to-margins 1in letter write -f svg $FILE
  
  echo "Done."
  echo "Opening $FILE..."

  open $FILE
else
    echo "Missing expected parameter."
fi