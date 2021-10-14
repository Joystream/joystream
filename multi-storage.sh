#!/usr/bin/env bash
set -e

# Script to run a second storage node and distributor node on local
# Make sure to run yarn start prior to running this script

set -a
. .env
set +a

export COLOSSUS_PORT_2=3335
export DISTRIBUTOR_PORT_2=3336
export KEYS=[//Alice]
export BUCKETS='all'
export WORKER_ID=2
export ACCOUNT_KEYFILE="./types/augment/all/defs.json"

function down()
{
    # Stop containers and clear volumes
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf distributor-node-2
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf colossus-2
}

down

trap down EXIT

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml run -d --name colossus-2 colossus-2

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml run -d --name distributor-node-2 distributor-node-2

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
