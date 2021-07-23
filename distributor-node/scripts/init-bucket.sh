#!/usr/bin/env bash

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run
CONFIG_PATH="../config.yml"
${CLI} leader:set-buckets-per-bag-limit -l 10 -c ${CONFIG_PATH} -y
FAMILY_ID=`${CLI} leader:create-bucket-family -c "${CONFIG_PATH}" -y`
BUCKET_ID=`${CLI} leader:create-bucket --family "${FAMILY_ID}" --acceptBags -c "${CONFIG_PATH}" -y`
${CLI} leader:update-bag -b static:council --family "${FAMILY_ID}" --add "${BUCKET_ID}" -c "${CONFIG_PATH}" -y
