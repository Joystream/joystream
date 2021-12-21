#!/usr/bin/env bash


# Must be run on the clean development chain.
# It tests all leader and operator commands.


SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run

# Set Alice as leader
${CLI}  dev:init # leader workerId = 0

# Update limits and constants
${CLI} leader:update-bag-limit -l 7 --dev
${CLI} leader:update-voucher-limits -o 100 -s 10000000 --dev
${CLI} leader:update-data-fee -f 10000 --dev
${CLI} leader:update-dynamic-bag-policy -n 10 -t Member --dev

# Create and configure a bucket.
BUCKET_ID=`${CLI} leader:create-bucket -i=0 --dev` # bucketId = 0
${CLI} operator:accept-invitation -w=0 -i=${BUCKET_ID} --dev -t=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
${CLI} leader:set-bucket-limits -i=${BUCKET_ID} -o=100 -s=10000000 --dev
${CLI} leader:update-bucket-status -i=${BUCKET_ID} --set on --dev
${CLI} leader:update-bag -a=${BUCKET_ID} -i static:council --dev 
${CLI} operator:set-metadata -w=0 -i=${BUCKET_ID} -e=http://localhost:3333 --dev
${CLI} operator:set-metadata -w=0 -i=${BUCKET_ID} -j=./operatorMetadata.json --dev

# Create and delete a bucket
BUCKET_ID=`${CLI} leader:create-bucket -a -n=100 -s=10000000  --dev` # bucketId = 1
${CLI} leader:delete-bucket -i=${BUCKET_ID}  --dev 

# Create a bucket, invite operator, cancel invite, accept invitation and remove operator.
BUCKET_ID=`${CLI} leader:create-bucket -a -n=100 -s=10000000  --dev` # bucketId = 2
${CLI} leader:invite-operator -i=${BUCKET_ID} -w=0  --dev 
${CLI} leader:cancel-invite -i=${BUCKET_ID} --dev 
${CLI} leader:invite-operator -i=${BUCKET_ID} -w=0  --dev 
${CLI} operator:accept-invitation -i=${BUCKET_ID} -w=0 --dev -t=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
${CLI} leader:remove-operator -i=${BUCKET_ID}   --dev 

# Toggle uploading block.
${CLI} leader:set-global-uploading-status --set on --dev 
${CLI} leader:set-global-uploading-status --set off --dev 

# Blacklist.
${CLI} leader:update-blacklist -a BLACKLISTED_CID -r SOME_CID --dev