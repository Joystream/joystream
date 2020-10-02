# FROM node:12
FROM ubuntu:18.04 as builder

# Install any needed packages
RUN apt-get update && apt-get install -y curl git gnupg

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

WORKDIR /joystream
RUN npm install -g yarn

COPY . /joystream

RUN NODE_ENV=production yarn install --frozen-lockfile

# install globally - used to build translations in pioneer but for some reason
# insn't installed into node_modules/.bin or pioneer/node_modules/.bin after running
# yarn install
RUN npm install -g i18next-scanner

# RUN yarn workspace pioneer build:code
RUN yarn workspace pioneer build
RUN yarn workspace @joystream/cli build
RUN yarn workspace storage-node build

ENV PATH="${PATH}:/joystream/node_modules/.bin"
ENTRYPOINT [ "yarn" ]
