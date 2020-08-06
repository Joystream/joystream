#!/bin/sh
## create both
cd ./../ && cli codegen
## fire up and bootstrap the indexer
cd ./generated/indexer && yarn start:dev &
## start the graphql server
cd ./generated/graphql-server && yarn start:dev &