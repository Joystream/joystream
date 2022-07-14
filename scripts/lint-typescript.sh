#!/usr/bin/env bash
set -e

yarn workspace query-node-root lint
yarn workspace @joystream/distributor-cli lint
yarn workspace network-tests lint
yarn workspace @joystream/types checks
yarn workspace @joystream/metadata-protobuf lint
yarn workspace storage-node lint
