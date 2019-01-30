#!/usr/bin/env bash

set -e

bold=$(tput bold)
normal=$(tput sgr0)

# Save current directory.
pushd . >/dev/null

MODULE=proposals
echo "Run tests for ${bold}$MODULE${normal} module..."
cd ./runtime
cargo test $MODULE

# Restore initial directory.
popd >/dev/null
