FROM node:12 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn install --frozen-lockfile

# Pioneer is failing to build only on github actions workflow runner
# Error: packages/page-staking/src/index.tsx(24,21): error TS2307: Cannot find module './Targets' or its corresponding type declarations.
# RUN yarn workspace pioneer build
RUN yarn workspace storage-node build
RUN yarn workspace query-node-root build

ENTRYPOINT [ "yarn" ]
