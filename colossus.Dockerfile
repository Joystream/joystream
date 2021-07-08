FROM --platform=linux/x86-64 node:14 as builder

WORKDIR /joystream
COPY . /joystream
RUN  rm -fr /joystream/pioneer

EXPOSE 3001

RUN yarn --frozen-lockfile

RUN yarn workspace @joystream/types build
RUN yarn workspace storage-node build

RUN yarn

ENTRYPOINT yarn colossus --dev --ws-provider $WS_PROVIDER_ENDPOINT_URI
