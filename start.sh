#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker
export JOYSTREAM_NODE_TAG=${JOYSTREAM_NODE_TAG:=$(./scripts/runtime-code-shasum.sh)}

INIT_CHAIN_SCENARIO=${INIT_CHAIN_SCENARIO:=setupNewChain}

if [ "${PERSIST}" == true ]
then
  echo "Services starting up.."
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

if [ "${SKIP_NODE}" != true ]
then
  ## Run a local development chain
  docker-compose up -d joystream-node
fi

## Query Node Infrastructure
./query-node/start.sh

## Orion
docker-compose up -d orion

## Init the chain with some state
if [[ $SKIP_CHAIN_SETUP != 'true' ]]; then
  export SKIP_MOCK_CONTENT=true
  export SKIP_QUERY_NODE_CHECKS=true
  HOST_IP=$(tests/network-tests/get-host-ip.sh)
  export COLOSSUS_1_URL=${COLOSSUS_1_URL:="http://${HOST_IP}:3333"}
  export DISTRIBUTOR_1_URL=${DISTRIBUTOR_1_URL:="http://${HOST_IP}:3334"}
  ./tests/network-tests/run-test-scenario.sh ${INIT_CHAIN_SCENARIO}

  ## Member faucet
  export SCREENING_AUTHORITY_SEED=$(cat ./tests/network-tests/output.json | jq -r .faucet.suri)
  export INVITING_MEMBER_ID=$(cat ./tests/network-tests/output.json | jq -r .faucet.memberId)
  docker-compose up -d faucet

  ## Storage Infrastructure Nodes
  docker-compose up -d colossus-1
  docker-compose up -d distributor-1
fi

if [ "${PERSIST}" == true ]
then
  echo "All services started in the background"
else
  echo "use Ctrl+C to shutdown the development network."
  while true; do
    read
  done
fi
