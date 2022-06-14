#!/usr/bin/env bash

# Compute a hash over files related to building joystream/node docker image

# Cargo workspace root
export WORKSPACE_ROOT=`cargo metadata --offline --no-deps --format-version 1 | jq .workspace_root -r`

cd ${WORKSPACE_ROOT}

TAR=tar
SED=sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  TAR=gtar
  SED=gsed
fi

export TEST_NODE_BLOCKTIME=1000

if [[ -n "$ALL_PROPOSALS_PARAMETERS_JSON" ]] && [[ -n "$TEST_NODE" ]]; then
  echo "Do not set both TEST_NODE and ALL_PROPOSALS_PARAMETERS_JSON env variables"
  exit 1
elif [[ -z "$ALL_PROPOSALS_PARAMETERS_JSON" ]] && [[ -z "$TEST_NODE" ]]; then
  PROPOSALS_PARAMETERS_FILE=""
elif [[ -n "$TEST_NODE" ]]; then
  PROPOSALS_PARAMETERS_FILE="./tests/network-tests/proposal-parameters.json"
else
  mkdir -p runtime-inputs
  PROPOSALS_PARAMETERS_FILE="./runtime-inputs/proposal-parameters-input.json"
  echo $ALL_PROPOSALS_PARAMETERS_JSON > $PROPOSALS_PARAMETERS_FILE
fi

# sort/owner/group/mtime arguments only work with gnu version of tar!
${TAR} -c --sort=name --owner=root:0 --group=root:0 --mode 644 --mtime='UTC 2020-01-01' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    utils/chain-spec-builder \
    joystream-node.Dockerfile \
    joystream-node-armv7.Dockerfile \
    node \
    $PROPOSALS_PARAMETERS_FILE \
    | if [[ -n "$TEST_NODE" ]]; then ${SED} '$a'"$TEST_NODE_BLOCKTIME"; else tee; fi \
    | shasum \
    | cut -d " " -f 1
