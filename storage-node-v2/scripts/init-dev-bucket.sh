#!/usr/bin/env bash

# These commands were not implemented yet as CLI commands.
# Please, run them via Pioneer.
# - updateStorageBucketsPerBagLimit(new_limit)

yarn storage-node dev:init
yarn storage-node leader:create-bucket -i=0 -a --dev 
yarn storage-node operator:accept-invitation -w=0 -b=0 --dev
yarn storage-node leader:update-bag -b=0 --dev 