set -e

TMP=$0
THIS_DIR=`dirname $TMP`

echo "Staring storage infrastructure"

# Start Storage-Squid
docker compose -f $THIS_DIR/../../docker-compose.storage-squid.yml up -d

HOST_IP=`$THIS_DIR/get-host-ip.sh`
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export COLOSSUS_2_URL="http://${HOST_IP}:3335"
export DISTRIBUTOR_2_URL="http://${HOST_IP}:3336"

if [ ! -z "$CLEANUP_INTERVAL" ]; then
    # Cleanup testing configuration
    export CLEANUP="true"
    export CLEANUP_INTERVAL
    export CLEANUP_NEW_OBJECT_EXPIRATION_PERIOD=10 # 10 seconds
    export CLEANUP_MIN_REPLICATION_THRESHOLD=1
    echo "Cleanup enabled!"
    echo "Cleanup interval: ${CLEANUP_INTERVAL}m"
    echo "New object expiration period: ${CLEANUP_NEW_OBJECT_EXPIRATION_PERIOD}s"
    echo "Min. replication threshold: ${CLEANUP_MIN_REPLICATION_THRESHOLD}"
fi

$THIS_DIR/run-test-scenario.sh initStorageAndDistribution

# give QN time to catch up so nodes can get their initial state
sleep 30

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
