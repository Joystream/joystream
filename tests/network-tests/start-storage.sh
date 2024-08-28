set -e

source .env

TMP=$0
THIS_DIR=(dirname $TMP)

echo "Staring storage infrastructure"

# Start Storage-Squid
docker compose -f $THIS_DIR/../../docker-compose.storage-squid.yml up -d

HOST_IP=`$THIS_DIR/get-host-ip.sh`
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export COLOSSUS_2_URL="http://${HOST_IP}:3335"
export DISTRIBUTOR_2_URL="http://${HOST_IP}:3336"
$THIS_DIR/run-test-scenario.sh initStorageAndDistribution

# give QN time to catch up so nodes can get their initial state
sleep 30

# Start localstack if ENABLE_LOCALSTACK is set to true
export LOCALSTACK_ENABLED=true
export LOCALSTACK_HOST="${HOST_IP}:4566"
export LOCALSTACK_ENDPOINT="http://${LOCALSTACK_HOST}"
docker compose -f $THIS_DIR/../../docker-compose.localstack.yml up -d localstack && sleep 15
python3 -m venv .venv
source .venv/bin/activate
pip install awscli-local
awslocal s3api create-bucket --bucket test-bucket-1 --endpoint ${LOCALSTACK_ENDPOINT}
awslocal s3api create-bucket --bucket test-bucket-2 --endpoint ${LOCALSTACK_ENDPOINT}
deactivate

# Start colossus & argus
docker compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
docker compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-2
docker compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-2

# allow a few seconds for nodes to startup and display first few log entries
# to help debug tests
sleep 30

echo "## squid_graphql-server"
docker logs squid_graphql-server --tail 300
echo "## squid_processor"
docker logs squid_processor --tail 300
echo "## colossus-1"
docker logs colossus-1 --tail 300
echo "## colossus-2"
docker logs colossus-2 --tail 300
echo "## distributor-1"
docker logs distributor-1 --tail 300
echo "## distributor-2"
docker logs distributor-2 --tail 300
