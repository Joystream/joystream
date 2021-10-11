#!/usr/bin/env bash
set -e

# Script to run a second storage node and distributor node on local
# Make sure to run yarn start prior to running this script

export COLOSSUS_PORT_2=3335
export DISTRIBUTOR_PORT_2=3336

set -a
. .env
set +a

function down()
{
    # Stop containers and clear volumes
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf distributor-node-2
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf colossus-2
}

down

trap down EXIT

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml run -d --name \
    colossus-2 --entrypoint sh colossus-2 -c "yarn storage-node server --queryNodeHost ${QUERY_NODE_HOST} --port ${COLOSSUS_PORT_2} \
        --uploads /data --worker ${WORKER_ID} --apiUrl ${WS_PROVIDER_ENDPOINT_URI} --sync --syncInterval=1 \
        --keyFile=${ACCOUNT_KEYFILE} --elasticSearchHost=${ELASTIC_SEARCH_HOST}"

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml run -d --name distributor-node-2 distributor-node-2

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
