FROM mikefarah/yq as manifest-maker
# Change metadata.source in manifest file. It's not possible to override it via flag/env.
USER root
ARG WS_PROVIDER_ENDPOINT_URI
COPY ./query-node/manifest.yml /joystream/qn-manifest.yml
RUN yq e -i ".typegen.metadata.source = \"$WS_PROVIDER_ENDPOINT_URI\"" /joystream/qn-manifest.yml

FROM --platform=linux/x86-64 node:14 as builder

WORKDIR /joystream
COPY . /joystream
COPY --from=manifest-maker /joystream/qn-manifest.yml /joystream/query-node/manifest.yml

RUN rm -fr /joystream/pioneer

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn --forzen-lockfile

RUN yarn workspace @joystream/types build
RUN yarn workspace @joystream/metadata-protobuf build
RUN yarn workspace query-node-root build

# Second stage to reduce image size, enable it when
# all packages have correctly identified what is a devDependency and what is not.
# It will reduce the image size by about 500MB (down from 2.2GB to 1.7GB)

# # Remove files that are not needed after build.
# # We will re-fetch only dependencies needed for running the apps.
# RUN rm -fr node_modules/
# RUN rm -fr .git/

# FROM node:12
# WORKDIR /joystream
# COPY --from=builder /joystream/ /joystream/

# # Skip installing devDependencies, since we have already built the packages.
# ENV NODE_ENV=production
# RUN yarn install --forzen-lockfile --production

ENTRYPOINT [ "yarn" ]
