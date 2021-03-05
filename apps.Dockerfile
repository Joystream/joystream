FROM node:12 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn --forzen-lockfile

# Pioneer is the 'heaviest' package in terms of dependencies
# RUN yarn workspace pioneer build
RUN yarn workspace query-node-root build
RUN yarn workspace storage-node build

# Remove files that are not needed after build.
# We will re-fetch only dependencies needed for running the apps.
RUN rm -fr node_modules/
RUN rm -fr .git/

FROM node:12
WORKDIR /joystream
COPY --from=builder /joystream/ /joystream/

# Skip installing devDependencies, since we have already built the packages.
# Important to make sure packages have correctly identified what is a devDependency and what is not.
ENV NODE_ENV=production
RUN yarn install --forzen-lockfile --production

ENTRYPOINT [ "yarn" ]
