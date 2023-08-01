#!/usr/bin/env bash

set -e

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    # Prevent interactive prompts that would interrup the installation
    export DEBIAN_FRONTEND=noninteractive
    # code build tools
    sudo apt-get update -y
    sudo apt-get install -y coreutils clang llvm jq curl gcc xz-utils sudo pkg-config \
      unzip libc6-dev make libssl-dev python3 cmake protobuf-compiler libprotobuf-dev

    # Docker: do not replace existing installation to avoid distrupting running containers
    if ! command -v docker &> /dev/null
    then
      # Install Docker from linux distro maintaners
      sudo apt-get install -y docker.io containerd runc
    fi
    # Install latest version of docker-compose
    COMPOSE_VERSION=$(curl -sL https://api.github.com/repos/docker/compose/releases/latest | jq -r ".tag_name")
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # install brew package manager
    if ! which brew >/dev/null 2>&1; then
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    fi
    # install additional packages
    brew update
    brew install coreutils gnu-tar jq curl llvm gnu-sed cmake || :
    echo "It is recommended to setup Docker desktop from: https://www.docker.com/products/docker-desktop"
    echo "It is also recommended to install qemu emulators with following command:"
    echo "docker run --privileged --rm tonistiigi/binfmt --install all"
fi

# If OS is supported will install build tools for rust and substrate.
# Skips installation of substrate and subkey
# old script trying to install package 'protobuf' which does not exist
# curl https://getsubstrate.io -sSf | bash -s -- --fast

# Install Rust toolchain since we no longer use getsubstrate.io script
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

source ~/.cargo/env

rustup update
rustup update nightly

rustup install nightly-2022-05-11
rustup target add wasm32-unknown-unknown --toolchain nightly-2022-05-11

rustup component add --toolchain nightly-2022-05-11 clippy
rustup component add rustfmt

# Install substrate keychain tool
# You can use docker instead https://github.com/paritytech/substrate/tree/master/bin/utils/subkey#run-in-a-container
# cargo install --force subkey --git https://github.com/paritytech/substrate --version ^2.0.2 --locked

# Volta nodejs, npm, yarn tools manager
if ! [[ $1 == "--no-volta" ]]; then
  curl https://get.volta.sh | bash

  # source env variables added by Volta
  source ~/.bash_profile || source ~/.profile || source ~/.bashrc || :

  volta install node
  volta install yarn
  volta install npx
fi

echo "You may need to open a new terminal/shell session to make newly installed tools available."
