FROM liuchong/rustup:1.41.1 AS builder
LABEL description="Joystream substrate node"

WORKDIR /joystream
COPY . /joystream
ENV TERM=xterm

RUN apt-get update && apt-get install git clang -y \
    && ./setup.sh \
    && cargo build --release \
    && cp ./target/release/joystream-node . \
    && cargo clean \
    && rm -fr target \
    && rm -fr ~/.cargo \
    && rm -fr ~/.rustup \
    && apt-get remove git clang -y \
    && rm -fr /var/lib/apt/lists/*

VOLUME ["/data", "/keystore"]

ENTRYPOINT ["/joystream/joystream-node"]

