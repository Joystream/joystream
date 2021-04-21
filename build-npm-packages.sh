#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/content-metadata-protobuf build:ts
yarn workspace query-node-root build
yarn workspace @joystream/cli build
yarn workspace storage-node build
yarn workspace pioneer build
