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
response=$(curl -s -w "\n%{http_code}\n" -X POST -u "${ELASTIC_USERNAME}":"${ELASTIC_PASSWORD}" "http://localhost:9200/_security/service/elastic/kibana/credential/token/my_kibana_token" -H 'Content-Type: application/json')
response_body=$(echo "$response" | head -n1)
status_code=$(echo "$response" | tail -n1)

if [ -z "$status_code" ]; then
    echo "Error: Did not receive a status code from the server"
    exit 1
fi

if [ "$status_code" -ne 200 ]; then
    error_message=$(echo $response_body | jq -r '.error.root_cause')
    echo -e "\nError: Failed to generate the service token: \n$error_message"
    exit 1
fi

# Extract & export the token from the response
export ELASTICSEARCH_SERVICEACCOUNTTOKEN=$(echo $response_body | jq -r '.token.value')

echo 'Starting for Kibana...'

## Run docker-compose to start kibana container
docker-compose -f ./docker-compose.elasticsearch.yml up -d kibana

echo 'Starting APM Server...'

## Run docker-compose to start apm-server container
docker-compose -f ./docker-compose.elasticsearch.yml up -d apm-server
