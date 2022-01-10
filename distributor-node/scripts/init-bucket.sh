#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export CONFIG_PATH="../config.yml"
CLI=../bin/run

${CLI} dev:init
${CLI} leader:set-buckets-per-bag-limit -l 10
FAMILY_ID=`${CLI} leader:create-bucket-family ${CONFIG}`
BUCKET_INDEX=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
BUCKET_ID="${FAMILY_ID}:${BUCKET_INDEX}"
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -a ${BUCKET_INDEX}
${CLI} leader:update-bucket-mode -B ${BUCKET_ID} --mode on
${CLI} leader:invite-bucket-operator -B ${BUCKET_ID} -w 0
${CLI} operator:accept-invitation -B ${BUCKET_ID} -w 0
${CLI} operator:set-metadata -B ${BUCKET_ID} -w 0 -e http://localhost:3334
${CLI} leader:update-dynamic-bag-policy -t Channel -p ${FAMILY_ID}:1
${CLI} leader:update-dynamic-bag-policy -t Member -p ${FAMILY_ID}:1
