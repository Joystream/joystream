FROM --platform=linux/x86-64 node:14 as builder

WORKDIR /joystream
COPY . /joystream

RUN yarn --frozen-lockfile

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace storage-node-v2 build

# Use these volumes to persist uploading data and to pass the keyfile.
VOLUME ["/data", "/keystore"]

# Required variables
ENV WS_PROVIDER_ENDPOINT_URI=ws://not-set
ENV COLOSSUS_PORT=3333
ENV QUERY_NODE_ENDPOINT=http://not-set/graphql
ENV WORKER_ID=not-set
# - set external key file using the `/keystore` volume
ENV ACCOUNT_KEYFILE=
ENV ACCOUNT_PWD=
# Optional variables
ENV SYNC_INTERVAL=1
ENV ELASTIC_SEARCH_ENDPOINT=
# warn, error, debug, info
ENV ELASTIC_LOG_LEVEL=debug
# - overrides account key file
ENV ACCOUNT_URI=

# Colossus node port
EXPOSE ${COLOSSUS_PORT}

WORKDIR /joystream/storage-node-v2
ENTRYPOINT yarn storage-node server --queryNodeEndpoint ${QUERY_NODE_ENDPOINT} --port ${COLOSSUS_PORT} --uploads /data --worker ${WORKER_ID} --apiUrl ${WS_PROVIDER_ENDPOINT_URI} --sync --syncInterval=${SYNC_INTERVAL} --keyFile=${ACCOUNT_KEYFILE} --elasticSearchEndpoint=${ELASTIC_SEARCH_ENDPOINT}
