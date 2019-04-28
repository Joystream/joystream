#!/usr/bin/env bash

set -e

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

export CARGO_INCREMENTAL=0

bold=$(tput bold)
normal=$(tput sgr0)

# Save current directory.
pushd . >/dev/null

RUNTIME_DIR="substrate-runtime-joystream"
if [ ! -d "$RUNTIME_DIR" ]; then
    echo "The '$RUNTIME_DIR' directory is missing. Did you git clone or symlink it yet?"
    exit 1
fi

for SRC in "$RUNTIME_DIR/"
do
  echo "${bold}Building webassembly binary in $SRC...${normal}"
  cd "$PROJECT_ROOT/$SRC"

  ./build.sh

  cd - >> /dev/null
done

# Restore initial directory.
popd >/dev/null
