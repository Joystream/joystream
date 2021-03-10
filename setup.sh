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

# Current version of substrate requires an older version of nightly toolchain
# to successfully compile the WASM runtime. We force install because rustfmt package
# is not available for this nightly version.
rustup install nightly-2020-05-23 --force
rustup target add wasm32-unknown-unknown --toolchain nightly-2020-05-23

# Latest clippy linter which comes with 1.47.0 fails on some subtrate modules
# Also note combination of newer versions of toolchain with the above nightly
# toolchain to build wasm seems to fail.
# So we need to stick with an older version until we update substrate
rustup install 1.46.0
rustup default 1.46.0

# Volta nodejs, npm, yarn tools manager
curl https://get.volta.sh | bash

# source env variables added by Volta
source source ~/.bash_profile || ~/.profile || source ~/.bashrc || :

volta install node@12
volta install yarn
volta install npx

echo "Starting new terminal/shell session to make newly installed tools available."

exec bash -l