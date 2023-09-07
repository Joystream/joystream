#!/usr/bin/env bash

# Compute a hash over files related to building joystream/node docker image

# Assuming cargo workspace root is same as the git repo root
cd $(git rev-parse --show-toplevel)

TAR=tar
SED=sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  TAR=gtar
  SED=gsed
fi

# sort/owner/group/mtime arguments only work with gnu version of tar!
${TAR} -c --sort=name --owner=root:0 --group=root:0 --mode 644 --mtime='UTC 2020-01-01' \
    --exclude='*.md' \
    Cargo.lock \
    Cargo.toml \
    runtime \
    runtime-modules \
    joystream-node.Dockerfile \
    bin \
    | if [[ -n "$RUNTIME_PROFILE" ]]; then ${SED} '$a'"$RUNTIME_PROFILE"; else tee; fi \
    | shasum \
    | cut -d " " -f 1
