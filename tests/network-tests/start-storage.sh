set -e

source .env

TMP=$0
THIS_DIR=$(dirname $TMP)

echo "Staring storage infrastructure"
export LOCALSTACK_ENABLED=true

# Start Storage-Squid
docker-compose -f $THIS_DIR/../../docker-compose.storage-squid.yml up -d

HOST_IP=$($THIS_DIR/get-host-ip.sh)
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export COLOSSUS_2_URL="http://${HOST_IP}:3335"
export DISTRIBUTOR_2_URL="http://${HOST_IP}:3336"
export LOCALSTACK_ENDPOINT="http://${HOST_IP}:4566"
$THIS_DIR/run-test-scenario.sh initStorageAndDistribution

# give QN time to catch up so nodes can get their initial state
sleep 30

# Start colossus & argus
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-2
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-2

# Start localstack if ENABLE_LOCALSTACK is set to true
docker-compose -f $THIS_DIR/../../docker-compose.localstack.yml up -d localstack
awslocal s3api create-bucket --bucket $AWS_BUCKET_NAME --endpoint http://localhost:4566

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
