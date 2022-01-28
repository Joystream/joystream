#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker

INIT_CHAIN_SCENARIO=${INIT_CHAIN_SCENARIO:=setupNewChain}

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
export SKIP_QUERY_NODE_CHECKS=true
# TODO: Move back to this approach once Giza<->Olympia integration tests merged
# HOST_IP=$(tests/network-tests/get-host-ip.sh)
# export COLOSSUS_1_URL="http://${HOST_IP}:3333"
# export COLOSSUS_1_TRANSACTOR_KEY=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${COLOSSUS_1_TRANSACTOR_URI} --output-type json | jq .ss58Address -r)
# export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
./tests/integration-tests/run-test-scenario.sh ${INIT_CHAIN_SCENARIO}

## Member faucet
docker-compose up -d faucet

## Storage Infrastructure Configuration
# TODO: Move back to INIT_CHAIN_SCENARIO approach once Giza<->Olympia integration tests merged
./storage-playground-config.sh

## Query Node Infrastructure
./query-node/start.sh

## Storage Infrastructure Nodes
docker-compose up -d colossus-1
docker-compose up -d distributor-1

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
