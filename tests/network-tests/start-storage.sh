TMP=$0
THIS_DIR=`dirname $TMP`

# Run proposals tests first, since they require no leads hired
$THIS_DIR/run-test-scenario.sh proposals

# Setup storage & distribution
HOST_IP=`$THIS_DIR/get-host-ip.sh`
# Because proposals tests hire and then fire each lead,
# we need to override COLOSSUS_1_WORKER_ID (0 => 1) and DISTRIBUTOR_1_WORKER_ID (0 => 1)
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export COLOSSUS_1_WORKER_ID=1
export COLOSSUS_1_WORKER_URI=//testing//worker//Storage//${COLOSSUS_1_WORKER_ID}
export COLOSSUS_1_TRANSACTOR_KEY=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${COLOSSUS_1_TRANSACTOR_URI} --output-type json | jq .ss58Address -r)
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export DISTRIBUTOR_1_WORKER_ID=1
export DISTRIBUTOR_1_ACCOUNT_URI=//testing//worker//Distribution//${DISTRIBUTOR_1_WORKER_ID}
REUSE_KEYS=true $THIS_DIR/run-test-scenario.sh init-storage-and-distribution

# Start colossus & argus
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d colossus-1
docker-compose -f $THIS_DIR/../../docker-compose.yml up -d distributor-1
