FROM node:18 as builder

WORKDIR /joystream

COPY ./chain-metadata.json chain-metadata.json
COPY ./yarn.lock yarn.lock
COPY ./types/package.json types/package.json
COPY ./metadata-protobuf/package.json metadata-protobuf/package.json
COPY ./devops/eslint-config/package.json ./devops/eslint-config/package.json
COPY ./devops/prettier-config/package.json ./devops/prettier-config/package.json
COPY ./storage-node/package.json storage-node/package.json
COPY ./storage-node/client/package.json storage-node/client/package.json
COPY ./distributor-node/package.json distributor-node/package.json
COPY ./distributor-node/client/package.json distributor-node/client/package.json
COPY ./opentelemetry/package.json opentelemetry/package.json
COPY ./package.json package.json

RUN yarn --frozen-lockfile

COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./storage-node ./storage-node
COPY ./devops/eslint-config ./devops/eslint-config
COPY ./devops/prettier-config ./devops/prettier-config
COPY ./distributor-node distributor-node
COPY ./opentelemetry opentelemetry
COPY ./tsconfig.json ./tsconfig.json

# Build & cleanup
# (must be inside a single "RUN", see: https://stackoverflow.com/questions/40212836/docker-image-larger-than-its-filesystem)
RUN \
  yarn workspace @joystream/types build &&\
  yarn workspace @joystream/metadata-protobuf build &&\
  yarn workspace @joystream/storage-node-client build &&\
  yarn workspace @joystream/opentelemetry build &&\
  yarn workspace @joystream/distributor-cli build &&\
  yarn cache clean

FROM node:18 as final
WORKDIR /joystream
COPY --from=builder /joystream /joystream
RUN yarn --frozen-lockfile --production

EXPOSE 3334

ENTRYPOINT ["yarn", "joystream-distributor"]
CMD ["start"]
