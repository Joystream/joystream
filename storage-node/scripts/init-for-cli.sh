#!/usr/bin/env bash

# Must be run on the clean development chain.

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run

${CLI} dev:init
${CLI} leader:update-bag-limit -l 7 --dev
${CLI} leader:update-voucher-limits -o 1000 -s 10000000000 --dev
BUCKET_ID=`${CLI} leader:create-bucket -i=0 -a -n=1000 -s=10000000000  --dev`
${CLI} operator:accept-invitation -w=0 -i=${BUCKET_ID} --dev -t=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
${CLI} leader:update-bag -a=${BUCKET_ID} -i static:council --dev
${CLI} leader:update-dynamic-bag-policy -n 1 -t Channel --dev
${CLI} operator:set-metadata -w=0 -i=${BUCKET_ID} -e http://localhost:3333 --dev
${CLI} leader:update-data-fee -f 100 --dev

mkdir -p ~/tmp/uploads
${CLI} server -w 0 -o 3333 -d ~/tmp/uploads --dev
