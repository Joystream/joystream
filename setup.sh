#!/usr/bin/env bash

set -e

# If OS is supported will install build tools for rust and substrate.
# Skips installing substrate itself and subkey
curl https://getsubstrate.io -sSf | bash -s -- --fast

source ~/.cargo/env

rustup component add rustfmt clippy

# Current version of substrate requires an older version of nightly toolchain
# to successfully compile the WASM runtime. We force install because rustfmt package
# is not available for this nightly version.
rustup install nightly-2020-05-23 --force
rustup target add wasm32-unknown-unknown --toolchain nightly-2020-05-23

# Sticking with older version of compiler to ensure working build
rustup install 1.46.0
rustup default 1.46.0

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    apt-get install -y coreutils clang jq curl gcc xz-utils sudo pkg-config unzip clang libc6-dev-i386
    apt-get install -y docker.io docker-compose
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install b2sum gnu-tar jq curl
    echo "It is recommended to setup Docker desktop from: https://www.docker.com/products/docker-desktop"
fi

# Volta nodejs, npm, yarn tools manager
curl https://get.volta.sh | bash

volta install node@12
volta install yarn
volta install npx
