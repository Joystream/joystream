#!/usr/bin/env bash

yarn storage-node dev:init
yarn storage-node leader:update-bag-limit -l 7 --dev
yarn storage-node leader:create-bucket -i=0 -a --dev 
yarn storage-node operator:accept-invitation -w=0 -b=0 --dev
yarn storage-node leader:update-bag -b=0 -i static:council --dev 