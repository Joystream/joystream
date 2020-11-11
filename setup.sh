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

# Ensure the stable toolchain is still the default
rustup default stable

# TODO: Install additional tools...

# - b2sum
# - nodejs
# - npm
# - yarn
# .... ?