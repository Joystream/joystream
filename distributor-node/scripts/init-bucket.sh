#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export CONFIG_PATH="../config.yml"
CLI=../bin/run

${CLI} dev:init
${CLI} leader:set-buckets-per-bag-limit -l 10
FAMILY_ID=`${CLI} leader:create-bucket-family ${CONFIG}`
BUCKET_ID=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bucket-mode -f ${FAMILY_ID} -B ${BUCKET_ID} --mode on
${CLI} leader:invite-bucket-operator -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} operator:accept-invitation -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} operator:set-metadata -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0 -e http://localhost:3334
${CLI} leader:update-dynamic-bag-policy -t Channel -p ${FAMILY_ID}:1
${CLI} leader:update-dynamic-bag-policy -t Member -p ${FAMILY_ID}:1
