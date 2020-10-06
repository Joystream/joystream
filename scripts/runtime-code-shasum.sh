#!/usr/bin/env bash

# Compute a hash over files related to building joystream/node docker image

# Cargo workspace root
export WORKSPACE_ROOT=`cargo metadata --offline --no-deps --format-version 1 | jq .workspace_root -r`

cd ${WORKSPACE_ROOT}

# srot/owner/group/mtime arguments only work with gnu version of tar.
# So if you run this on Mac the default version of tar is `bsdtar`
# and you will not get an idempotent result.
# Install gnu-tar with brew
#   brew install gnu-tar
#   export PATH="/usr/local/opt/gnu-tar/libexec/gnubin:$PATH"
tar -c --sort=name --owner=root:0 --group=root:0 --mtime='UTC 2020-01-01' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    utils/chain-spec-builder \
    joystream-node.Dockerfile | shasum | cut -d " " -f 1

