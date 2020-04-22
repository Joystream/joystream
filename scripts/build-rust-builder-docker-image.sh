#!/usr/bin/env bash

# Build the joystream/rust-builder image
docker build --tag joystream/rust-builder \
    --file ./devops/dockerfiles/rust-builder/Dockerfile \
    .

