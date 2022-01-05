#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/metadata-protobuf build
yarn workspace query-node-root build
yarn workspace @joystream/cli build
yarn workspace storage-node build
yarn workspace storage-node build
yarn workspace pioneer build
