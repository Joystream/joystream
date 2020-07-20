#!/usr/bin/env bash

# Build the node and runtime image
docker build --tag joystream/node-testing \
    --file ./devops/dockerfiles/ansible-node/Dockerfile \
    .

