#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location used to store chain data, generated spec file and initial members
# and balances for the test chain.
DATA_PATH=./data
rm -Rf ${DATA_PATH}/alice
rm -Rf ${DATA_PATH}/auth-*


# Initial account balance for Alice
# Alice is the source of funds for all new accounts that are created in the tests.
INITIAL_BALANCE="10000000000"
ALICE="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
BOB="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
CHARLIE="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"

mkdir -p ${DATA_PATH}

echo "{
  \"balances\":[
    [\"${ALICE}\", ${INITIAL_BALANCE}],
    [\"${BOB}\", ${INITIAL_BALANCE}],
    [\"${CHARLIE}\", ${INITIAL_BALANCE}]
  ],
  \"vesting\":[
    [\"${CHARLIE}\", "0", "25", "10000"]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Override initial balances from external source
if [[ $INITIAL_BALANCES == http* ]];
then
  >&2 echo "fetching ${INITIAL_BALANCES}"
  wget -O ${DATA_PATH}/initial-balances.json ${INITIAL_BALANCES}
else
  if [ ! -z "$INITIAL_BALANCES" ]; then
    if jq -e . >/dev/null 2>&1 <<<"$INITIAL_BALANCES"; then
      >&2 echo "Detected some valid JSON in INITIAL_BALANCES"
      echo $INITIAL_BALANCES > ${DATA_PATH}/initial-balances.json
    else
      >&2 echo "Failed to parse INITIAL_BALANCES as JSON, or got false/null"
    fi
  fi
fi

# Create a chain spec file
../../target/release/chain-spec-builder \
  new \
  --fund-accounts \
  -a //Alice \
  --chain-spec-path ${DATA_PATH}/chain-spec.json \
  --initial-balances-path ${DATA_PATH}/initial-balances.json \
  --deployment dev \
  --sudo-account ${ALICE} \
  --keystore-path ${DATA_PATH}

../../target/release/joystream-node --base-path ${DATA_PATH}/alice \
  --keystore-path ${DATA_PATH}/auth-0 \
  --validator --chain ${DATA_PATH}/chain-spec.json \
  --unsafe-ws-external --unsafe-rpc-external \
  --rpc-methods Unsafe --rpc-cors=all \
  --pruning=archive --no-telemetry
