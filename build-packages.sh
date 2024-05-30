#!/usr/bin/env bash

set -e

if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v python3 &>/dev/null; then
        brew install python@3.12
    fi
    brew install python-setuptools
fi
yarn --frozen-lockfile
yarn workspace @joystream/types build
yarn workspace @joystream/metadata-protobuf build
yarn workspace @joystream/js build
yarn workspace @joystream/opentelemetry build
yarn workspace query-node-root build
yarn workspace @joystream/cli build
yarn workspace storage-node build
yarn workspace @joystream/distributor-cli build
yarn workspace network-tests build
