#!/usr/bin/env bash
set -e

## Run a local development chain
docker-compose up -d joystream-node-2

# Init the chain with 2 storage buckets that have high limits set
# The DynamicBagPolicy for Channel should be "numberOfStorageBuckets: 2" after this step is done
./tests/network-tests/run-test-scenario.sh giza-issue-reproduction-setup

# Set env for CLI's
export AUTO_CONFIRM=true
export ACCOUNT_URI=//testing//worker//Storage//0 # Storage lead account uri for storage CLI

# Setup the CLI:
yarn joystream-cli api:setUri ws://localhost:9944
yarn joystream-cli account:choose --address 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
yarn joystream-cli api:setQueryNodeEndpoint http://localhost:8081/graphql

# Set very low limits for storage bucket 0
yarn storage-node leader:set-bucket-limits -i 0 -s 100 -o 1
# Create a channel (the transaction will fail due to low limits of bucket 0)
yarn joystream-cli content:createChannel --context Member -i ./cli/examples/content/CreateChannel.json || true
# Update DynamicBagPolicy to 1 storage bucket per channel bag
yarn storage-node leader:update-dynamic-bag-policy -t Channel -n 1
# Disable storage bucket 0
yarn storage-node leader:update-bucket-status -i 0 --set off
# Create a channel (the transaction still fails, which is unexpected)
yarn joystream-cli content:createChannel --context Member -i ./cli/examples/content/CreateChannel.json || true
# Increase limits of bucket 0
yarn storage-node leader:set-bucket-limits -i 0 -s 1000000000 -o 1000
# Create a channel
yarn joystream-cli content:createChannel --context Member -i ./cli/examples/content/CreateChannel.json
# Notice that channel bag get's assigned to both bucket 0 and 1, even though:
# 1. Bucket 0 is disabled
# 2. DynamicBagPolicy for Channel has "numberOfStorageBuckets: 1"
