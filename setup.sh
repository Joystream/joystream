#!/usr/bin/env bash

set -e

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    # code build tools
    sudo apt-get update
    sudo apt-get install -y coreutils clang jq curl gcc xz-utils sudo pkg-config unzip clang libc6-dev-i386 make libssl-dev python
    # docker
    sudo apt-get install -y docker.io docker-compose containerd runc
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # install brew package manager
    if ! which brew >/dev/null 2>&1; then
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    fi
    # install additional packages
    brew update
    brew install b2sum gnu-tar jq curl
    echo "It is recommended to setup Docker desktop from: https://www.docker.com/products/docker-desktop"
fi

# If OS is supported will install build tools for rust and substrate.
# Skips installation of substrate and subkey
curl https://getsubstrate.io -sSf | bash -s -- --fast

source ~/.cargo/env

rustup component add rustfmt clippy

rustup install nightly-2020-10-06
rustup target add wasm32-unknown-unknown --toolchain nightly-2020-10-06

rustup install 1.47.0
rustup default 1.47.0

# Volta nodejs, npm, yarn tools manager
curl https://get.volta.sh | bash

# source env variables added by Volta
source source ~/.bash_profile || ~/.profile || source ~/.bashrc || :

volta install node@12
volta install yarn
volta install npx

echo "Starting new terminal/shell session to make newly installed tools available."

exec bash -l
