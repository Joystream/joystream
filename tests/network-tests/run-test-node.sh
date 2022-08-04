#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location used to store chain data, generated spec file and initial members
# and balances for the test chain.
DATA_PATH=./data

# Initial account balance for Alice
# Alice is the source of funds for all new accounts that are created in the tests.
ALICE_INITIAL_BALANCE=1000000000000000000

mkdir -p ${DATA_PATH}

echo "{
  \"balances\":[
    [\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\", ${ALICE_INITIAL_BALANCE}]
  ]
}" > ${DATA_PATH}/initial-balances.json

function cleanup() {
    rm -Rf ${DATA_PATH}/alice
}

trap cleanup EXIT

# Create a chain spec file
../../target/release/chain-spec-builder new -a Alice \
  --chain-spec-path ${DATA_PATH}/chain-spec.json \
  --initial-balances-path ${DATA_PATH}/initial-balances.json \
  --deployment dev \
  --sudo-account 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

../../target/release/joystream-node --base-path ${DATA_PATH}/alice \
  --validator --chain ${DATA_PATH}/chain-spec.json --alice --unsafe-ws-external --rpc-cors all --pruning=archive
