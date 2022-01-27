#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export CONFIG_PATH="../config.yml"
CLI=../bin/run

${CLI} dev:init
${CLI} leader:set-buckets-per-bag-limit -l 10
# Create family and buckets
FAMILY_ID=`${CLI} leader:create-bucket-family`
BUCKET_1_INDEX=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
BUCKET_2_INDEX=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
BUCKET_1_ID="${FAMILY_ID}:${BUCKET_1_INDEX}"
BUCKET_2_ID="${FAMILY_ID}:${BUCKET_2_INDEX}"
# Test adding 2 buckets to bag at once
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -a ${BUCKET_1_INDEX} ${BUCKET_2_INDEX}
# Test removing 2 buckets from bag at once
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -r ${BUCKET_1_INDEX} ${BUCKET_2_INDEX}
# Adding single bucket to all static bags
${CLI} leader:update-bag -b static:council -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:storage -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:content -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:operationsAlpha -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:operationsBeta -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:operationsGamma -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:gateway -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
${CLI} leader:update-bag -b static:wg:distribution -f ${FAMILY_ID} -a ${BUCKET_1_INDEX}
# Update bucket status / mode
${CLI} leader:update-bucket-status -B ${BUCKET_1_ID}  --acceptingBags yes
${CLI} leader:update-bucket-mode -B ${BUCKET_1_ID} --mode on
${CLI} leader:update-bucket-status -B ${BUCKET_2_ID}  --acceptingBags no
${CLI} leader:update-bucket-mode -B ${BUCKET_2_ID} --mode off
# Update dynamic bag policies
${CLI} leader:update-dynamic-bag-policy -t Channel -p ${FAMILY_ID}:5
${CLI} leader:update-dynamic-bag-policy -t Member -p ${FAMILY_ID}:5
${CLI} leader:update-dynamic-bag-policy -t Member
# Bucket invitations + cancelling and accepting
${CLI} leader:invite-bucket-operator -B ${BUCKET_1_ID} -w 0
${CLI} leader:invite-bucket-operator -B ${BUCKET_2_ID} -w 0
${CLI} operator:accept-invitation -B ${BUCKET_1_ID} -w 0
${CLI} leader:cancel-invitation -B ${BUCKET_2_ID} -w 0
# Setting metadata
${CLI} operator:set-metadata -B ${BUCKET_1_ID} -w 0 -i ./data/operator-metadata.json
${CLI} leader:set-bucket-family-metadata -f ${FAMILY_ID} -i ./data/family-metadata.json

# Deletion commands tested separately
FAMILY_TO_DELETE_ID=`${CLI} leader:create-bucket-family`
BUCKET_TO_DELETE_INDEX=`${CLI} leader:create-bucket -f ${FAMILY_TO_DELETE_ID} -a yes`
BUCKET_TO_DELETE_ID="${FAMILY_TO_DELETE_ID}:${BUCKET_TO_DELETE_INDEX}"
${CLI} leader:invite-bucket-operator -B ${BUCKET_TO_DELETE_ID} -w 0
${CLI} operator:accept-invitation -B ${BUCKET_TO_DELETE_ID} -w 0
${CLI} leader:remove-bucket-operator -B ${BUCKET_TO_DELETE_ID} -w 0
${CLI} leader:delete-bucket -B ${BUCKET_TO_DELETE_ID}
${CLI} leader:delete-bucket-family -f ${FAMILY_TO_DELETE_ID}
