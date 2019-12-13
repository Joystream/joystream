FROM liuchong/rustup:1.39.0 AS builder
LABEL description="Joystream substrate node"

WORKDIR /joystream
COPY . /joystream
ENV TERM=xterm

RUN apt-get update && apt-get install git clang -y \
    && ./setup.sh \
    && cargo build --release \
    && cp ./target/release/joystream-node . \
    && rm -fr target/ \
    && apt-get remove git clang -y \
    && rm -fr /var/lib/apt/lists/*
ENTRYPOINT ["/joystream/joystream-node"]

