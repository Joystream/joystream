#!/usr/bin/env bash
set -e

## Query Node Infrastructure
./query-node/start.sh

## Orion
./start-orion.sh

## Faucet
export SKIP_QUERY_NODE_CHECKS=true
./tests/network-tests/run-test-scenario.sh setupFaucet

export INVITER_KEY=$(cat ./tests/network-tests/output.json | jq -r .faucet.suri)
docker-compose up -d faucet
