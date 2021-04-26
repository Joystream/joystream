#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/content-metadata-protobuf build
yarn workspace query-node-root build
# For now cli build is broken.. proceed anyway
yarn workspace @joystream/cli build || :
yarn workspace storage-node build
yarn workspace pioneer build
