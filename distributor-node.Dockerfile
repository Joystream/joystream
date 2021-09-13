FROM --platform=linux/x86-64 node:14 as builder

WORKDIR /joystream
COPY ./types types
COPY ./metadata-protobuf metadata-protobuf
COPY ./distributor-node distributor-node
COPY ./distributor-node/config/docker/config.docker.yml config.yml
COPY ./yarn.lock yarn.lock
COPY ./package.json package.json

EXPOSE 3334

RUN yarn --frozen-lockfile

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace @joystream/distributor-cli build

# Clean unneeded files
RUN find . -name "node_modules" -type d -prune
RUN yarn --frozen-lockfile --production
RUN yarn cache clean

ENTRYPOINT ["yarn", "joystream-distributor"]
CMD ["start"]
