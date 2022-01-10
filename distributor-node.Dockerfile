FROM --platform=linux/x86-64 node:14 as builder

WORKDIR /joystream
COPY ./.git .git
COPY ./chain-metadata.json chain-metadata.json
COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./distributor-node distributor-node
COPY ./yarn.lock yarn.lock
COPY ./package.json package.json

EXPOSE 3334

# Build & cleanup
# (must be inside a signle "RUN", see: https://stackoverflow.com/questions/40212836/docker-image-larger-than-its-filesystem)
RUN \
  yarn --frozen-lockfile &&\
  yarn workspace @joystream/types build &&\
  yarn workspace @joystream/metadata-protobuf build &&\
  yarn workspace @joystream/distributor-cli build &&\
  find . -name "node_modules" -type d -prune &&\
  yarn --frozen-lockfile --production &&\
  yarn cache clean

ENV CONFIG_PATH ./distributor-node/config/docker/config.docker.yml

ENTRYPOINT ["yarn", "joystream-distributor"]
CMD ["start"]
