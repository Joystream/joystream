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

# TODO: Install additional tools...

# - b2sum
# - nodejs
# - npm
# - yarn
# .... ?