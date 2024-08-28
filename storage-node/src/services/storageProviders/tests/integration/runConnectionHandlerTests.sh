#! /bin/bash
set -e

export THIS_DIR=$(pwd)
export LOCALSTACK_ENDPOINT="http://localhost:4566"

docker compose -f $THIS_DIR/../../../../../../docker-compose.localstack.yml up -d localstack
sleep 1

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    source .venv/bin/activate
    pip install awscli-local
else
    source .venv/bin/activate
fi

awslocal s3api create-bucket --bucket test-bucket --endpoint ${LOCALSTACK_ENDPOINT} --region us-east-1
deactivate

LOCALSTACK_ENABLED=true jest --detectOpenHandles './src/services/storageProviders/tests/integration/connectionHandler.test.ts'
