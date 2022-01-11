# Location that will be mounted as the /data volume in containers
# This is how we access the initial members and balances files from
# the containers and where generated chainspec files will be located.
DATA_PATH="test-data"

# Initial account balance for Alice
# Alice is the source of funds for all new accounts that are created in the tests.
ALICE_INITIAL_BALANCE=100000000

rm -Rf ${DATA_PATH}
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

# Create a chain spec file
./target/release/chain-spec-builder generate -a 2 -e 2 -k ${DATA_PATH} --chain-spec-path ${DATA_PATH}/chain-spec.json --initial-balances-path ${DATA_PATH}/initial-balances.json --initial-members-path ${DATA_PATH}/initial-members.json --deployment live > ${DATA_PATH}/seeds

jq -c '.id = "js_babylon_test"' ${DATA_PATH}/chain-spec.json > tmp.$$.json && mv tmp.$$.json ${DATA_PATH}/chain-spec.json
jq -c '.protocolId = "js/babylon/test"' ${DATA_PATH}/chain-spec.json > tmp.$$.json && mv tmp.$$.json ${DATA_PATH}/chain-spec.json

timeout 3s ./target/release/joystream-node --base-path ${DATA_PATH}/alice3  --validator --chain ${DATA_PATH}/chain-spec.json


timeout 3s ./target/release/joystream-node --base-path ${DATA_PATH}/bob4  --validator --port 30334 --ws-port 9945 --chain ${DATA_PATH}/chain-spec.json


mv  ${DATA_PATH}/auth-0/* ${DATA_PATH}/alice3/chains/js_babylon_test/keystore
mv  ${DATA_PATH}/auth-1/* ${DATA_PATH}/bob4/chains/js_babylon_test/keystore

rm -Rf ${DATA_PATH}/alice3/chains/js_babylon_test/db
rm -Rf ${DATA_PATH}/bob4/chains/js_babylon_test/db

# RUN
#./target/release/joystream-node --base-path test-data/alice3  --validator --chain test-data/chain-spec.json --pruning=archive --log runtime,txpool,transaction-pool
#./target/release/joystream-node --base-path test-data/bob4 --validator --port 30334 --ws-port 9945 --chain test-data/chain-spec.json --pruning=archive --log runtime,txpool,transaction-pool
