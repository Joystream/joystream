FROM liuchong/rustup:nightly AS builder
LABEL description="Rust and WASM build environment for joystream and substrate"

WORKDIR /setup
COPY setup.sh /setup
ENV TERM=xterm

RUN ./setup.sh
