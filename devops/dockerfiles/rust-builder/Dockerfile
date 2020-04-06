FROM liuchong/rustup:1.42.0 AS builder
LABEL description="Rust and WASM build environment for joystream and substrate"

WORKDIR /setup
COPY setup.sh /setup
ENV TERM=xterm

RUN ./setup.sh