# Build the image from https://github.com/joystream/docker-files/rust-wasm/
FROM rust-wasm

WORKDIR /runtime

COPY . /runtime

RUN ./build.sh
