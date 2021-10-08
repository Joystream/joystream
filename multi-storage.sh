set -a
. .env
set +a

function down()
{
    # Stop containers and clear volumes
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf distributor-node-2
    docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml rm -vsf colossus-2
}

trap down EXIT

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml run -d --name \
    colossus-2 --entrypoint sh colossus-2 -c "yarn storage-node dev:init --apiUrl ${WS_PROVIDER_ENDPOINT_URI} && \
        yarn storage-node server --queryNodeHost ${QUERY_NODE_HOST} --port 3335 \
        --uploads /data --worker ${WORKER_ID} --apiUrl ${WS_PROVIDER_ENDPOINT_URI} --sync --syncInterval=1 \
        --keyFile=${ACCOUNT_KEYFILE} --elasticSearchHost=${ELASTIC_SEARCH_HOST}"

docker-compose -f docker-compose.yml -f docker-compose.multi-storage.yml up -d distributor-node-2

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
