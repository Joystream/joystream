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
COPY ./opentelemetry/package.json opentelemetry/package.json
COPY ./package.json package.json

RUN yarn --frozen-lockfile

COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./devops/eslint-config ./devops/eslint-config
COPY ./devops/prettier-config ./devops/prettier-config
COPY ./storage-node storage-node
COPY ./opentelemetry opentelemetry
COPY ./tsconfig.json ./tsconfig.json

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace @joystream/opentelemetry build
RUN yarn workspace storage-node build
RUN yarn cache clean

FROM node:18 as final
WORKDIR /joystream
COPY --from=builder /joystream /joystream
RUN yarn --frozen-lockfile --production

# Use these volumes to persist uploading data and to pass the keyfile.
VOLUME ["/data", "/keystore", "/logs"]

# Colossus node port
EXPOSE 3333

ENTRYPOINT ["yarn", "storage-node"]
CMD ["server"]
