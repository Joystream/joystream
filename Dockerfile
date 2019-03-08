# Build the image from https://github.com/joystream/docker-files/
FROM rust-wasm

WORKDIR /runtime

COPY . /runtime

RUN ./build.sh
