#!/usr/bin/env bash

# Compute a hash over files related to building joystream/node docker image

# Cargo workspace root
export WORKSPACE_ROOT=`cargo metadata --offline --no-deps --format-version 1 | jq .workspace_root -r`

cd ${WORKSPACE_ROOT}

TAR=tar
SED=sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  TAR=gtar
  SED=gsed
fi

# sort/owner/group/mtime arguments only work with gnu version of tar!
${TAR} -c --sort=name --owner=root:0 --group=root:0 --mode 644 --mtime='UTC 2020-01-01' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    utils/chain-spec-builder \
    joystream-node.Dockerfile \
    joystream-node-armv7.Dockerfile \
    node \
    | if [[ -n "$RUNTIME_PROFILE" ]]; then ${SED} '$a'"$RUNTIME_PROFILE"; else tee; fi \
    | shasum \
    | cut -d " " -f 1
