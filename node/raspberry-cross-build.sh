#!/bin/sh

### Cross build for Raspberry Pi - using docker ###
docker pull joystream/rust-raspberry

docker run \
    --volume ${PWD}/:/home/cross/project \
    --volume ${HOME}/.cargo/registry:/home/cross/.cargo/registry \
    joystream/rust-raspberry \
    build --release

# output will be in project folder:
# target/arm-unknown-linux-gnueabihf/joystream-node
