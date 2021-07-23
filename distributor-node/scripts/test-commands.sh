#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run
CONFIG_PATH="../config.yml"
${CLI} leader:set-buckets-per-bag-limit -l 10 -c ${CONFIG_PATH} -y
FAMILY_ID=`${CLI} leader:create-bucket-family -c "${CONFIG_PATH}" -y`
BUCKET_ID=`${CLI} leader:create-bucket -f "${FAMILY_ID}" -a -c "${CONFIG_PATH}" -y`
${CLI} leader:update-bag -b static:council -f "${FAMILY_ID}" -a "${BUCKET_ID}" -c "${CONFIG_PATH}" -y
${CLI} leader:delete-bucket -f "${FAMILY_ID}" -B "${BUCKET_ID}" -c "${CONFIG_PATH}" -y
${CLI} leader:delete-bucket-family -f "${FAMILY_ID}" -c "${CONFIG_PATH}" -y
