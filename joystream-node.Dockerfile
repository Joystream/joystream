FROM rust:1.61.0-buster AS rust
WORKDIR /joystream
RUN apt-get update && \
  apt-get install -y curl git gcc xz-utils sudo pkg-config unzip clang llvm libc6-dev cmake
RUN rustup self update
RUN rustup install nightly-2022-05-11 --force
RUN rustup default nightly-2022-05-11
RUN rustup target add wasm32-unknown-unknown --toolchain nightly-2022-05-11
RUN rustup component add --toolchain nightly-2022-05-11 clippy
RUN rustup install nightly
# Temporary build fix by using older version of cargo-chef
# https://github.com/Joystream/joystream/issues/4745
RUN cargo +nightly install cargo-chef@0.1.57

FROM rust AS planner
LABEL description="Cargo chef prepare"
WORKDIR /joystream
COPY Cargo.toml .
COPY Cargo.lock .
COPY bin ./bin
COPY runtime ./runtime
COPY runtime-modules ./runtime-modules
RUN cargo chef prepare --recipe-path /joystream/recipe.json

FROM rust AS cacher
LABEL description="Cargo chef cook dependencies"
WORKDIR /joystream
COPY --from=planner /joystream/recipe.json /joystream/recipe.json
ARG WASM_BUILD_TOOLCHAIN=nightly-2022-05-11
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path /joystream/recipe.json

FROM rust AS builder
LABEL description="Compiles all workspace artifacts"
WORKDIR /joystream
COPY Cargo.toml .
COPY Cargo.lock .
COPY bin ./bin
COPY runtime ./runtime
COPY runtime-modules ./runtime-modules
# Copy over the cached dependencies
COPY --from=cacher /joystream/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME

# Build all cargo crates
# Ensure our tests and linter pass before actual build
ARG CARGO_FEATURES
RUN echo "CARGO_FEATURES=$CARGO_FEATURES"
ARG WASM_BUILD_TOOLCHAIN=nightly-2022-05-11
ARG GIT_COMMIT_HASH="unknown"
ARG CODE_SHASUM
RUN SUBSTRATE_CLI_GIT_COMMIT_HASH="${GIT_COMMIT_HASH}-docker-build-${CODE_SHASUM}" \
  cargo build --release --features "${CARGO_FEATURES}"

FROM ubuntu:22.04
LABEL description="Joystream node"
WORKDIR /joystream
COPY --from=builder /joystream/target/release/joystream-node /joystream/node
COPY --from=builder /joystream/target/release/wbuild/joystream-node-runtime/joystream_node_runtime.compact.wasm /joystream/runtime.compact.wasm
COPY --from=builder /joystream/target/release/wbuild/joystream-node-runtime/joystream_node_runtime.compact.compressed.wasm /joystream/runtime.compact.compressed.wasm
COPY --from=builder /joystream/target/release/chain-spec-builder /joystream/chain-spec-builder
COPY --from=builder /joystream/target/release/session-keys /joystream/session-keys
COPY --from=builder /joystream/target/release/call-sizes /joystream/call-sizes
COPY joy-mainnet.json .

# confirm it works
RUN /joystream/call-sizes
RUN /joystream/node --version

# https://manpages.debian.org/stretch/coreutils/b2sum.1.en.html
# RUN apt-get install coreutils
# print the blake2 256 hash of the wasm blob
RUN b2sum -l 256 /joystream/runtime.compact.wasm
# print the blake2 512 hash of the wasm blob
RUN b2sum -l 512 /joystream/runtime.compact.wasm

EXPOSE 30333 9933 9944

# Use these volumes to persits chain state and keystore, eg.:
# --base-path /data
# optionally separate keystore (otherwise it will be stored in the base path)
# --keystore-path /keystore
# if base-path isn't specified, chain state is stored inside container in ~/.local/share/joystream-node/
# which is not ideal
VOLUME ["/data", "/keystore"]

ENTRYPOINT ["/joystream/node"]
CMD ["--base-path", "/data", "--keystore-path", "/keystore", "--chain", "/joystream/joy-mainnet.json"]
