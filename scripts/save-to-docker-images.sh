#!/usr/bin/env bash
set -e

# clean start
docker-compose -f ../docker-compose.yml down -v

function cleanup() {
    docker-compose -f ../docker-compose.yml down -v
}

trap cleanup EXIT

export RUNTIME_PROFILE=TESTING

TAG=$(./runtime-code-shasum.sh)

#./scripts/cargo-build.sh

if [[ -z $JOYSTREAM_NODE_TAG ]]; then
    JOYSTREAM_NODE_TAG="latest"
fi

# start node image, network and volume
docker-compose -f ../docker-compose.yml up -d joystream-node

# copy native runtime
docker cp ../target/release/joystream-node joystream-node:/joystream/node

# copy wasm runtime
docker cp ../target/release/wbuild/joystream-node-runtime/joystream_node_runtime.compact.wasm joystream-node:/joystream/runtime.compact.wasm

# copy chainspec buildr
docker cp ../target/release/chain-spec-builder joystream-node:/joystream/chain-spec-builder

# save changes
docker commit joystream-node joystream/node:$TAG
