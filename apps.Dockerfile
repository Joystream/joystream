FROM node:12 as builder

WORKDIR /joystream
COPY . /joystream

# Do not set NODE_ENV=production until after running yarn install
# to ensure dev dependencies are installed.
RUN yarn install --frozen-lockfile

# ENV NODE_ENV=production
# Pioneer is failing to build only on github actions workflow runner
# Error: packages/page-staking/src/index.tsx(24,21): error TS2307: Cannot find module './Targets' or its corresponding type declarations.
# RUN yarn workspace pioneer build
RUN yarn workspace @joystream/cli build
RUN yarn workspace storage-node build

# The image is huge ~ 3GB!
# npm package Pruning.. getting rid of all devDependencies.
# ... to significantly reduce image size (by multiple GBs): It may  cause problems in case:
# 1. There are package dependencies which were added (incorrectly) as dev dependencies..
# 2. 'ts-node' is used and added as a non-dev dep -> ends up pulling in dependencies which
# would normally just be dev dependencies?
# some packages that are big: @types, babel, electron, prettier, eslint, test frameworks
# RUN npm prune --production
# I think it works for a simple pacakge but npm prune doesn't recognize yarn workspaces
# so it ends up removing too much and things break

# "yarn pruning"
# RUN cp -R node_modules/.bin somewhere.. ?
# But don't yarn workspace packages also go into node_modules/ ?
# How to keep those?
# RUN rm -fr node_modules/
# RUN yarn install --production  // should not have post install build steps that depend on devDependencies
# // RUN yarn cache clean
# Drops to 1.6GB but still too big!
# FROM node:12
# COPY --from=builder /joystream /joystream
# WORKDIR /joystream

ENTRYPOINT [ "yarn" ]
