FROM node:12 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn install --frozen-lockfile

RUN yarn workspace pioneer build
RUN yarn workspace storage-node build
RUN yarn workspace query-node-root build

ENTRYPOINT [ "yarn" ]
