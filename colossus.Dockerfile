FROM --platform=linux/x86-64 node:18 as builder

WORKDIR /joystream
COPY . /joystream

RUN \
  yarn && \
  yarn workspace @joystream/types build && \
  yarn workspace @joystream/metadata-protobuf build && \
  cd storage-node && yarn && yarn build

# Use these volumes to persist uploading data and to pass the keyfile.
VOLUME ["/data", "/keystore", "/logs"]

# Colossus node port
EXPOSE 3333

ENTRYPOINT ["yarn", "storage-node"]
CMD ["server"]