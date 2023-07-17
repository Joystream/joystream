FROM --platform=linux/x86-64 node:18 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn --frozen-lockfile

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace @joystream/js build
RUN yarn workspace @joystream/opentelemetry build
RUN yarn workspace query-node-root build

ENTRYPOINT [ "yarn" ]
