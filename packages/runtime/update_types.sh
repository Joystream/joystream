#!/usr/bin/env bash

BASE="$1"
if [ -z "$BASE" ] ; then
  echo "usage: update_types.sh /path/to/apps/" >&2
  exit 1
fi

for infile in "$BASE"/packages/joy-*/src/types.ts ; do
  base=$(echo $infile | sed 's;.*/joy-\([^/]*\)/.*;\1;g')
  cat ../../license_header.txt "$infile" \
    | sed 's;@polkadot/joy-\([^/]*\)/types;@joystream/runtime/types/\1;g' \
    > "types/${base}.ts"
done
