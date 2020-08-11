# Docker

## Building localy

A joystream-node can be compiled with given [Dockerfile](https://github.com/dzhelezov/joystream/tree/f07cb27a73ec74292811648cee8a92d8fab3b6c9/docs/using-docker/Dockerfile/README.md) file:

```bash
# Build and tag a new image, which will compile joystream-node from source
docker build . -t joystream-node

# run a development chain with the image just created publishing the websocket port
docker run -p 9944:9944 joystream-node --dev --ws-external
```

## Downloading joystream pre-built images from Docker Hub

```bash
docker pull joystream/node
```

## Running a public node as a service

Create a working directory to store the node's data and where you will need to place the chain file.

```bash
mkdir ${HOME}/joystream-node-data/

cp rome-testnet.json ${HOME}/joystream-node-data/

docker run -d -p 30333:30333 \
    -v ${HOME}/joystream-node-data/:/data \
    --name my-node \
    joystream/node --base-path /data --chain /data/rome-testnet.json

# check status
docker ps

# monitor logs
docker logs --tail 100 -f my-node
```

