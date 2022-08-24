#!/usr/bin/env bash
set -e

echo 'running typescript lints'
yarn workspace query-node-root lint
yarn workspace @joystream/distributor-cli checks
yarn workspace @joystream/cli checks
yarn workspace network-tests checks
yarn workspace @joystream/types checks
yarn workspace @joystream/metadata-protobuf checks
yarn workspace storage-node checks
