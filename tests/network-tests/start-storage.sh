set -e

TMP=$0
THIS_DIR=`dirname $TMP`

echo "Staring storage infrastructure"

HOST_IP=`$THIS_DIR/get-host-ip.sh`
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export COLOSSUS_2_URL="http://${HOST_IP}:3335"
export DISTRIBUTOR_2_URL="http://${HOST_IP}:3336"
$THIS_DIR/run-test-scenario.sh initStorageAndDistribution

# Start colossus & argus
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-2
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-2

# allow a few seconds for nodes to startup and display first few log entries
# to help debug tests
sleep 15

echo "## colossus-1"
docker logs colossus-1 --tail 300
echo "## colossus-2"
docker logs colossus-2 --tail 300
echo "## distributor-1"
docker logs distributor-1 --tail 300
echo "## distributor-2"
docker logs distributor-2 --tail 300