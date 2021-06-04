#!/usr/bin/env bash

# Compute a hash over files related to building joystream/node docker image

# Cargo workspace root
export WORKSPACE_ROOT=`cargo metadata --offline --no-deps --format-version 1 | jq .workspace_root -r`

cd ${WORKSPACE_ROOT}

TAR=tar
if [[ "$OSTYPE" == "darwin"* ]]; then
	TAR=gtar
fi

# sort/owner/group/mtime arguments only work with gnu version of tar!
${TAR} -c --sort=name --owner=root:0 --group=root:0 --mtime='UTC 2020-01-01' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    utils/chain-spec-builder \
    joystream-node.Dockerfile \
    $(echo "$PROPOSALS_PARAMETERS_PATH") | shasum | cut -d " " -f 1
