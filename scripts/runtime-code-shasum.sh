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

# Make sure same default value is set in joystream-node.Dockerfile
TEST_NODE_BLOCKTIME=1000
TEST_PROPOSALS_PARAMETERS_PATH="./tests/integration-tests/proposal-parameters.json"

# sort/owner/group/mtime arguments only work with gnu version of tar!
HASH=$(
  ${TAR} -c --sort=name --owner=root:0 --group=root:0 --mode 644 --mtime='UTC 2020-01-01' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    utils/chain-spec-builder \
    joystream-node.Dockerfile \
    joystream-node-armv7.Dockerfile \
    node \
    $(test -n "$TEST_NODE" && echo "$TEST_PROPOSALS_PARAMETERS_PATH") \
    | shasum \
    | cut -d " " -f 1
)

if [[ -n "$TEST_NODE" ]]; then SUFFIX=-test-${TEST_NODE_BLOCKTIME}; else SUFFIX= ; fi

echo ${HASH}${SUFFIX}
