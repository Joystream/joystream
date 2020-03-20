# syntax=docker/dockerfile:experimental
# must enable experimental features in docker daemon and set DOCKER_BUILDKIT=1 env variable
# https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/experimental.md
FROM joystream/rust-builder AS builder
LABEL description="compiles and caches dependencies, artifacts and node"
WORKDIR /joystream
COPY . /joystream
RUN mkdir /build-output

RUN --mount=type=cache,target=/joystream/target \
    --mount=type=cache,target=/root/.cargo/git \
    --mount=type=cache,target=/root/.cargo/registry \
    cargo build --release \
    && cp ./target/release/joystream-node /build-output/joystream-node
# copy in last part could be done with nightly option --out-dir

FROM debian:stretch
LABEL description="Joystream node"
WORKDIR /joystream
COPY --from=builder /build-output/joystream-node /joystream/node

# Use these volumes to persits chain state and keystore, eg.:
# --base-path /data
# optionally separate keystore (otherwise it will be stored in the base path)
# --keystore-path /keystore
# if base-path isn't specified, chain state is stored inside container in ~/.local/share/joystream-node/
# which is not ideal
VOLUME ["/data", "/keystore"]

ENTRYPOINT ["/joystream/node"]