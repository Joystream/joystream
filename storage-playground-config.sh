#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Basic script to be run to configure dev chain storage infrastructure.
# Assumes one storage lead and distributor lead are already hired
# and their identity information are stored in .env

# Load the worker ids and SURIs as local variables only
. .env

## Colossus 1
CLI=storage-node-v2/bin/run

${CLI} leader:update-bag-limit -l 10 --accountUri ${COLOSSUS_1_ACCOUNT_URI}
${CLI} leader:update-voucher-limits -o 10000 -s 1000000000000 --accountUri ${COLOSSUS_1_ACCOUNT_URI}
BUCKET_ID=`${CLI} leader:create-bucket -i=${COLOSSUS_1_WORKER_ID} -a -n=10000 -s=1000000000000  --accountUri ${COLOSSUS_1_ACCOUNT_URI}`
${CLI} operator:accept-invitation -w=${COLOSSUS_1_WORKER_ID} -i=${BUCKET_ID} --accountUri ${COLOSSUS_1_ACCOUNT_URI}
${CLI} leader:update-dynamic-bag-policy -n 1 -t Channel --accountUri ${COLOSSUS_1_ACCOUNT_URI}
${CLI} leader:update-data-fee -f 10 --accountUri ${COLOSSUS_1_ACCOUNT_URI} # Optionally - set some data fee per megabyte

# This is only set initially to the name of the container to make it accessible by the distributors running as containers
# in the same network. This should be updated to the "public" endpoint so the node is accessible from containers and
# external applications like Atlas for example that depend on discovering the endpoint uri by querying the query-node.
COLOSSUS_1_NODE_URI=${COLOSSUS_1_NODE_URI:="http://colossus-1:3333"}
${CLI} operator:set-metadata -w=${COLOSSUS_1_WORKER_ID} -i=${BUCKET_ID} -e="${COLOSSUS_1_NODE_URI}" --accountUri ${COLOSSUS_1_ACCOUNT_URI}

echo "Colossus 1 BUCKET_ID=${BUCKET_ID}"

## Distributor 1
export AUTO_CONFIRM=true
export CONFIG_PATH=$(pwd)/distributor-node/config.yml
export JOYSTREAM_DISTRIBUTOR__KEYS="[{\"suri\":\"${DISTRIBUTOR_1_ACCOUNT_URI}\"}]"
CLI=distributor-node/bin/run

${CLI} leader:set-buckets-per-bag-limit -l 10
FAMILY_ID=`${CLI} leader:create-bucket-family`
BUCKET_ID=`${CLI} leader:create-bucket -f ${FAMILY_ID} -a yes`
${CLI} leader:update-bucket-mode -f ${FAMILY_ID} -B ${BUCKET_ID} --mode on
${CLI} leader:update-dynamic-bag-policy -t Channel -p ${FAMILY_ID}:5
${CLI} leader:invite-bucket-operator -f ${FAMILY_ID} -B ${BUCKET_ID} -w ${DISTRIBUTOR_1_WORKER_ID}
${CLI} operator:accept-invitation -f ${FAMILY_ID} -B ${BUCKET_ID} -w ${DISTRIBUTOR_1_WORKER_ID}

# This should be updated to the "public" endpoint so the node is accessible from containers and
# external applications like Atlas for example that depend on discovering the endpoint uri by querying the query-node.
DISTRIBUTOR_1_NODE_URI=${DISTRIBUTOR_1_NODE_URI:="http://localhost:3334"}
${CLI} operator:set-metadata -f ${FAMILY_ID} -B ${BUCKET_ID} -w ${DISTRIBUTOR_1_WORKER_ID} -e="${DISTRIBUTOR_1_NODE_URI}"

echo "Distributor 1 FAMILY_ID=${FAMILY_ID}"
echo "Distributor 1 BUCKET_ID=${BUCKET_ID}"
