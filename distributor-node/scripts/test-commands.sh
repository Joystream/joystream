#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export CONFIG_PATH="../config.yml"
CLI=../bin/run

${CLI} dev:init
${CLI} leader:set-buckets-per-bag-limit -l 10
FAMILY_ID=`${CLI} leader:create-bucket-family`
BUCKET_ID=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bag -b static:wg:storage -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bag -b static:wg:content -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bag -b static:wg:operations -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bag -b static:wg:gateway -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bag -b static:wg:distribution -f ${FAMILY_ID} -a ${BUCKET_ID}
${CLI} leader:update-bucket-status -f ${FAMILY_ID} -B ${BUCKET_ID}  --acceptingBags yes
${CLI} leader:update-bucket-mode -f ${FAMILY_ID} -B ${BUCKET_ID} --mode on
${CLI} leader:update-dynamic-bag-policy -t Member -p ${FAMILY_ID}:5
${CLI} leader:update-dynamic-bag-policy -t Member
${CLI} leader:invite-bucket-operator -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} leader:cancel-invitation -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} leader:invite-bucket-operator -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} operator:accept-invitation -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} operator:set-metadata -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0 -i ./data/operator-metadata.json
${CLI} leader:remove-bucket-operator -f ${FAMILY_ID} -B ${BUCKET_ID} -w 0
${CLI} leader:set-bucket-family-metadata -f ${FAMILY_ID} -i ./data/family-metadata.json

# Deletion commands tested separately, since bucket operator removal is not yet supported
FAMILY_TO_DELETE_ID=`${CLI} leader:create-bucket-family`
BUCKET_TO_DELETE_ID=`${CLI} leader:create-bucket -f ${FAMILY_TO_DELETE_ID} -a yes`
${CLI} leader:delete-bucket -f ${FAMILY_TO_DELETE_ID} -B ${BUCKET_TO_DELETE_ID}
${CLI} leader:delete-bucket-family -f ${FAMILY_TO_DELETE_ID}
