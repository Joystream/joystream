#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

JSON_METADATA=$(cat ../chain-metadata.json)
CHAIN_METADATA=$(./fetch-chain-metadata.sh)
if [[ $(echo "$JSON_METADATA") == $(echo "$CHAIN_METADATA") ]]; then
  echo "OK";
else
  echo "Current chain metadata does not match chain-metadata.json file!"
  exit -1
fi
