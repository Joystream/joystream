TMP=$0
THIS_DIR=`dirname $TMP`

# make sure env variables are loaded before calling this script
#set -a
#. ../../.env
#set +a

HOST_IP=`$THIS_DIR/get-host-ip.sh`
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
$THIS_DIR/run-test-scenario.sh initStorageAndDistribution

# Start colossus & argus
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
