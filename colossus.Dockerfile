FROM --platform=linux/x86-64 node:18 as builder

WORKDIR /joystream
COPY ./chain-metadata.json chain-metadata.json
COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
# codegen.yml references:
# so we expect query-node was built on host to generate that schema file
COPY ./query-node/generated/graphql-server/generated/schema.graphql ./query-node/generated/graphql-server/generated/schema.graphql
COPY ./devops/eslint-config ./devops/eslint-config
COPY ./devops/prettier-config ./devops/prettier-config
COPY ./storage-node storage-node
COPY ./yarn.lock yarn.lock
COPY ./package.json package.json
COPY ./tsconfig.json ./tsconfig.json

RUN yarn --frozen-lockfile
RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace storage-node build
RUN find . -name "node_modules" -type d -prune
RUN yarn cache clean

FROM --platform=linux/x86-64 node:18 as final
WORKDIR /joystream
COPY --from=builder /joystream /joystream
RUN yarn --frozen-lockfile --production

# Use these volumes to persist uploading data and to pass the keyfile.
VOLUME ["/data", "/keystore", "/logs"]

# Colossus node port
EXPOSE 3333

ENTRYPOINT ["yarn", "storage-node"]
CMD ["server"]