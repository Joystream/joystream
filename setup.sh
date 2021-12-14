#!/usr/bin/env bash

set -e

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    # Prevent interactive prompts that would interrup the installation
    export DEBIAN_FRONTEND=noninteractive
    # code build tools
    sudo apt-get update
    sudo apt-get install -y coreutils clang llvm jq curl gcc xz-utils sudo pkg-config unzip libc6-dev make libssl-dev python
    # docker
    sudo apt-get install -y docker.io docker-compose containerd runc
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # install brew package manager
    if ! which brew >/dev/null 2>&1; then
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    fi
    # install additional packages
    brew update
    brew install coreutils gnu-tar jq curl llvm || :
    echo "It is recommended to setup Docker desktop from: https://www.docker.com/products/docker-desktop"
    echo "It is also recommended to install qemu emulators with following command:"
    echo "docker run --privileged --rm tonistiigi/binfmt --install all"
fi

# If OS is supported will install build tools for rust and substrate.
# Skips installation of substrate and subkey
curl https://getsubstrate.io -sSf | bash -s -- --fast

source ~/.cargo/env

rustup install nightly-2021-02-20
rustup target add wasm32-unknown-unknown --toolchain nightly-2021-02-20

rustup component add rustfmt clippy

# Install substrate keychain tool - install doesn't seem to work lately.
# cargo install --force subkey --git https://github.com/paritytech/substrate --version 2.0.1 --locked
# You can use docker instead https://github.com/paritytech/substrate/tree/master/bin/utils/subkey#run-in-a-container

# Volta nodejs, npm, yarn tools manager
curl https://get.volta.sh | bash

# source env variables added by Volta
source ~/.bash_profile || source ~/.profile || source ~/.bashrc || :

volta install node@14
volta install yarn
volta install npx

echo "You may need to open a new terminal/shell session to make newly installed tools available."
