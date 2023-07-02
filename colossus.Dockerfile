FROM --platform=linux/x86-64 node:18 as builder

WORKDIR /joystream

COPY ./chain-metadata.json chain-metadata.json
COPY ./yarn.lock yarn.lock
COPY ./types/package.json types/package.json
COPY ./metadata-protobuf/package.json metadata-protobuf/package.json
COPY ./storage-node/package.json storage-node/package.json
COPY ./package.json package.json

RUN yarn --frozen-lockfile

COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./devops/eslint-config ./devops/eslint-config
COPY ./devops/prettier-config ./devops/prettier-config
COPY ./storage-node storage-node
COPY ./tsconfig.json ./tsconfig.json

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace storage-node build
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