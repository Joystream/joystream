#!/usr/bin/env bash
set -e

# Assuming cargo workspace root is same as the git repo root
cd `git rev-parse --show-toplevel`

tar -czf joystream.tar.gz \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    joystream-node.Dockerfile \
    bin
