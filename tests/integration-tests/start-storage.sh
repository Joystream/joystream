TMP=$0
THIS_DIR=`dirname $TMP`

# make sure env variables are loaded before calling this script
#set -a
#. ../../.env
#set +a

HOST_IP=`$THIS_DIR/get-host-ip.sh`
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export COLOSSUS_1_TRANSACTOR_KEY=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${COLOSSUS_1_TRANSACTOR_URI} --output-type json | jq .ss58Address -r)
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
# TODO: revisit if this is needed after all Giza `network-tests` are converted into Olympia `integration-tests`
#$THIS_DIR/run-test-scenario.sh init-storage-and-distribution

# Start colossus & argus
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
