FROM node:10-alpine AS builder

RUN apk add --update --no-cache bash libtool git build-base autoconf automake python2 \
    && npm install -g yarn
WORKDIR /storage-node
COPY . /storage-node
RUN yarn run build

FROM node:10-alpine
WORKDIR /storage-node
COPY --from=builder /storage-node /storage-node
ENTRYPOINT [ "/storage-node/bin/cli.js" ]