#!/usr/bin/env bash
set -e

# Location that will be mounted as the /data volume in containers
# This is how we access the initial members and balances files from
# the containers and where generated chainspec files will be located.
DATA_PATH=${DATA_PATH:=~/tmp}
ALICE_INITIAL_BALANCE=${ALICE_INITIAL_BALANCE:=100000000}

mkdir -p ${DATA_PATH}

# Alice is the source of funds for all new members that are created in the tests.
echo "{
  \"balances\":[
    [\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\", ${ALICE_INITIAL_BALANCE}]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Make Alice a member
echo '
  [{
    "member_id":0,
    "root_account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "controller_account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "handle":"alice",
    "avatar_uri":"https://alice.com/avatar.png",
    "about":"Alice",
    "registered_at_time":0
  }]
' > ${DATA_PATH}/initial-members.json

# Create a chain spec file
docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder joystream/node \
  new \
  --authority-seeds Alice \
  --sudo-account  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --deployment dev \
  --chain-spec-path /data/chain-spec.json \
  --initial-balances-path /data/initial-balances.json \
  --initial-members-path /data/initial-members.json

# Convert the chain spec file to a raw chainspec file
docker run --rm -v ${DATA_PATH}:/data joystream/node build-spec \
  --raw --disable-default-bootnode \
  --chain /data/chain-spec.json > ~/tmp/chain-spec-raw.json

# Start a chain with generated chain spec
CONTAINER_ID=`docker run -d -v ${DATA_PATH}:/data -p 9944:9944 joystream/node \
  --validator --alice --unsafe-ws-external --rpc-cors=all --log runtime \
  --chain /data/chain-spec-raw.json`

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 30
    docker stop ${CONTAINER_ID}
    docker rm ${CONTAINER_ID}
}

trap cleanup EXIT

# Execute the tests
time DEBUG=* yarn workspace network-tests scenario-full