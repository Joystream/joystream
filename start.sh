#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker

INIT_CHAIN_SCENARIO=${INIT_CHAIN_SCENARIO:=setup-new-chain}

if [ "${PERSIST}" == true ]
then
  echo "Services startup up.."
else
  # Clean start!
  docker-compose down -v

  function down()
  {
      # Stop containers and clear volumes
      docker-compose down -v
  }

  trap down EXIT
fi

## Run a local development chain
docker-compose up -d joystream-node

## Init the chain with some state
export SKIP_MOCK_CONTENT=true
HOST_IP=$(tests/network-tests/get-host-ip.sh)
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
./tests/network-tests/run-test-scenario.sh ${INIT_CHAIN_SCENARIO}

## Set sudo as the membership screening authority
yarn workspace api-scripts set-sudo-as-screening-auth

## Member faucet
docker-compose up -d faucet

## Query Node Infrastructure
./query-node/start.sh

## Storage Infrastructure Nodes
docker-compose up -d colossus-1
docker-compose up -d distributor-1

## Pioneer UI
docker-compose up -d pioneer

## Orion
docker-compose up -d orion

if [ "${PERSIST}" == true ]
then
  echo "All services started in the background"
else
  echo "use Ctrl+C to shutdown the development network."
  while true; do
    read
  done
fi
