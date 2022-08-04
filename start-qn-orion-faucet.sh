#!/usr/bin/env bash
set -e

## Query Node Infrastructure
./query-node/start.sh

## Orion
docker-compose up -d orion

export SKIP_QUERY_NODE_CHECKS=true
./tests/network-tests/run-test-scenario.sh faucet

## Member faucet
export SCREENING_AUTHORITY_SEED=$(cat ./tests/network-tests/output.json | jq -r .faucet.suri)
export INVITING_MEMBER_ID=$(cat ./tests/network-tests/output.json | jq -r .faucet.memberId)
docker-compose up -d faucet
