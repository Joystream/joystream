#!/usr/bin/env bash

# Must be run on the clean development chain.
# It prepares an environment, creates a storage bucket and links it to the
# 'static council bag'.

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run

${CLI} dev:init
${CLI} leader:update-bag-limit -l 7 --dev
${CLI} leader:update-voucher-limits -o 100 -s 10000000 --dev
BUCKET_ID=`${CLI} leader:create-bucket -i=0 -a -n=100 -s=10000000  --dev` 
${CLI} operator:accept-invitation -w=0 -i=${BUCKET_ID} --dev
${CLI} leader:update-bag -a=${BUCKET_ID} -i static:council --dev 