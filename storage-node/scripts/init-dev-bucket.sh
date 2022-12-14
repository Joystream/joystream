#!/usr/bin/env bash

# Must be run on the clean development chain.
# It prepares an environment, creates a storage bucket and links it to the
# 'static council bag'.

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run

GROUP=storageWorkingGroup yarn workspace api-scripts initialize-lead
${CLI} leader:update-bag-limit -l 7 --dev
${CLI} leader:update-voucher-limits -o 10000 -s 1000000000 --dev
BUCKET_ID=`${CLI} leader:create-bucket -i=0 -a -n=10000 -s=1000000000  --dev`
${CLI} operator:accept-invitation -w=0 -i=${BUCKET_ID} --dev -t=j4W7rVcUCxi2crhhjRq46fNDRbVHTjJrz6bKxZwehEMQxZeSf
${CLI} leader:update-bag -a=${BUCKET_ID} -i static:council --dev
${CLI} operator:set-metadata -w 0 -i=${BUCKET_ID} -e http://localhost:3333 --dev
