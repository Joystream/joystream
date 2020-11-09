#!/usr/bin/env bash

set -e

# If OS is supported will install:
#  - build tools and any other dependencies required for rust and substrate
#  - rustup - rust insaller
#  - rust compiler and toolchains
#  - skips installing substrate and subkey
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

# Install additional tools...

# - docker engine, docker, docker-compose,
# - nodejs, npm, yarn (classic), npx
# - b2sum,