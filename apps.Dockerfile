FROM node:12 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn install --frozen-lockfile
# Uncomment query-node build when mappings are fixed
# RUN yarn workspace query-node-root build
RUN yarn workspace pioneer build
RUN yarn workspace storage-node build

ENTRYPOINT [ "yarn" ]
