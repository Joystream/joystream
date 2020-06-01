#!/bin/sh
set -x
## restart postgres
docker container ps | grep postgres | awk {'print $1'} | xargs -I {} docker restart {}
## drop and create db
cd ./../generated/graphql-server && yarn config:dev && yarn db:drop
## wipe out indexer and graphql-server
cd ./../../ && rm -rf ./generated/indexer && rm -rf ./generated/graphql-server
## create both
cli codegen
## fire up and bootstrap the indexer
cd ./generated/indexer && yarn start:dev &
## start the graphql server
cd ./../graphql-server && yarn start:dev &