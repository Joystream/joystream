#!/usr/bin/env bash
set -e

# Avoid pulling joystream images from docker hub. It is most likely
# not the version that we want to work with. 
# either build with `docker-compose build` or `docker pull` the image versions equired
if ! docker inspect joystream/node:latest > /dev/null 2>&1;
then
  echo "Didn't find a joystream/node:latest docker image."
  exit 1
fi

if ! docker inspect joystream/apps:latest > /dev/null 2>&1;
then
  echo "Didn't find a joystream/apps:latest docker image."
  exit 1
fi

# clean start!
docker-compose down -v

function down()
{
    # Stop containers and clear volumes
    docker-compose down -v
}

trap down EXIT

# Run a development joystream-node chain
docker-compose up -d joystream-node

# configure a dev storage node and start storage node
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init
docker-compose up -d colossus

# Initialise the content directory with standard classes, schemas and initial entities
yarn workspace cd-schemas initialize:dev

# Initialize a new database for the query node infrastructure
docker-compose up -d db
yarn workspace query-node-root db:migrate

# Startup all query-node infrastructure services
docker-compose up -d processor

echo "press Ctrl+C to shutdown"

# Start a dev instance of pioneer and wait for exit
docker-compose up pioneer

