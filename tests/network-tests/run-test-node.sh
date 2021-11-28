#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location that will be mounted as the /data volume in containers
# This is how we access the initial members and balances files from
# the containers and where generated chainspec files will be located.
DATA_PATH=./data

# Initial account balance for Alice
# Alice is the source of funds for all new accounts that are created in the tests.
ALICE_INITIAL_BALANCE=100000000

mkdir -p ${DATA_PATH}

echo "{
  \"balances\":[
    [\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\", ${ALICE_INITIAL_BALANCE}]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Make Alice a member
echo '
  [{
    "member_id": 0,
    "root_account": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "controller_account": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "handle":"alice_with_a_long_handle",
    "avatar_uri":"https://alice.com/avatar.png",
    "about":"Alice",
    "name": "Alice",
    "registered_at_time": 0
  },
  {
    "member_id": 1,
    "root_account": "5FUeDYFzvvizNhhHyidsuchG7jnToKj7zfimbWBpWKzT9Fqe",
    "controller_account": "5FUeDYFzvvizNhhHyidsuchG7jnToKj7zfimbWBpWKzT9Fqe",
    "handle":"bob_with_a_long_handle",
    "avatar_uri":"https://bob.com/avatar.png",
    "about":"Bob",
    "name": "Bob",
    "registered_at_time": 0
  }
]
' > ${DATA_PATH}/initial-members.json

function cleanup() {
    rm -Rf ${DATA_PATH}/alice
}

trap cleanup EXIT

# Create a chain spec file
../../target/release/chain-spec-builder new -a Alice \
  --chain-spec-path ${DATA_PATH}/chain-spec.json \
  --initial-balances-path ${DATA_PATH}/initial-balances.json \
  --initial-members-path ${DATA_PATH}/initial-members.json \
  --deployment dev \
  --sudo-account 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

../../target/release/joystream-node --base-path ${DATA_PATH}/alice \
  --validator --chain ${DATA_PATH}/chain-spec.json --alice --unsafe-ws-external --rpc-cors all
