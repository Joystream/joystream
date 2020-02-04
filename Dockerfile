FROM liuchong/rustup:1.34.0 AS builder
LABEL description="Joystream substrate node"

WORKDIR /substrate-node-joystream
COPY . /substrate-node-joystream
ENV TERM=xterm

RUN apt-get update && apt-get install git clang -y \
    && ./init-wasm.sh \
    && git clone -b v5.3.0 https://github.com/Joystream/substrate-runtime-joystream.git \
    && ./build-runtime.sh \
    && cargo build --release \
    && cargo install --path ./ \
    && apt-get remove git clang -y \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/root/.cargo/bin/joystream-node"]
