#!/usr/bin/env bash

set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
if [ -f /.env ]; then
    . /.env
fi
set +a

ELASTIC_USERNAME=${ELASTIC_USERNAME:="elastic"}
ELASTIC_PASSWORD=${ELASTIC_PASSWORD:="password"}

# Remove elasticsearch stack containers & volumes
docker-compose -f ./docker-compose.elasticsearch.yml down -v

# Run docker-compose to start elasticsearch container
docker-compose -f ./docker-compose.elasticsearch.yml up -d elasticsearch

echo 'Waiting for Elasticsearch...'

sleep 30

# Generate the service token
# Ref: https://www.elastic.co/guide/en/elasticsearch/reference/current/service-accounts.html#service-accounts-tokens
response=$(curl -f -s -X POST -u "${ELASTIC_USERNAME}":"${ELASTIC_PASSWORD}" "http://localhost:9200/_security/service/elastic/kibana/credential/token/my_kibana_token" -H 'Content-Type: application/json')

# Extract & export the token from the response
export ELASTICSEARCH_SERVICEACCOUNTTOKEN=$(echo $response | jq -r '.token.value')

echo 'Starting for Kibana...'

## Run docker-compose to start kibana container
docker-compose -f ./docker-compose.elasticsearch.yml up -d kibana

echo 'Starting APM Server...'

## Run docker-compose to start apm-server container
docker-compose -f ./docker-compose.elasticsearch.yml up -d apm-server
