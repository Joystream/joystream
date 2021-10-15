#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/metadata-protobuf build
# A joystream-node is expected to be running locally for query-node build to work
# either start a container with: docker-compose up -d joystream-node
# or run native binary with: ./scripts/run-dev-chain.sh
yarn workspace query-node-root build
yarn workspace @joystream/cli build
yarn workspace storage-node-v2 build
yarn workspace @joystream/distributor-cli build
# yarn workspace pioneer build
