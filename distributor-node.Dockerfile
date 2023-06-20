FROM --platform=linux/x86-64 node:18 as builder

WORKDIR /joystream
COPY ./chain-metadata.json chain-metadata.json
COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./storage-node ./storage-node
COPY ./devops/eslint-config ./devops/eslint-config
COPY ./devops/prettier-config ./devops/prettier-config
COPY ./distributor-node distributor-node
COPY ./yarn.lock yarn.lock
COPY ./package.json package.json
COPY ./tsconfig.json ./tsconfig.json

# Build & cleanup
# (must be inside a single "RUN", see: https://stackoverflow.com/questions/40212836/docker-image-larger-than-its-filesystem)
RUN \
  yarn --frozen-lockfile &&\
  yarn workspace @joystream/types build &&\
  yarn workspace @joystream/metadata-protobuf build &&\
  yarn workspace @joystream/storage-node-client build &&\
  yarn workspace @joystream/distributor-cli build &&\
  find . -name "node_modules" -type d -prune &&\
  yarn cache clean

FROM --platform=linux/x86-64 node:18 as final
WORKDIR /joystream
COPY --from=builder /joystream /joystream
RUN yarn --frozen-lockfile --production

EXPOSE 3334

ENTRYPOINT ["yarn", "joystream-distributor"]
CMD ["start"]
