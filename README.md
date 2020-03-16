![ Nodes for Joystream](./validator-node_new.svg)

# Joystream Full Node

Joystream node built with [Substrate](https://github.com/paritytech/substrate).

Follow the instructions below to download the software or build it from source.

For setting up a full node and valiador review the [advanced guide from the helpdesk](https://github.com/Joystream/helpdesk/tree/master/roles/validators).


##  Binary releases

The latest pre build binaries can be downloads from the [releases](https://github.com/Joystream/substrate-node-joystream/releases) page.


## Building from source

### Initial setup
If you want to build from source you will need the [Rust toolchain](https://rustup.rs/), openssl and llvm/libclang. You can install the required dependencies with:

```bash
git clone https://github.com/Joystream/substrate-node-joystream.git
cd substrate-node-joystream/
git checkout v2.1.2
./setup.sh
```

If you are familiar with docker see the [building with docker section](#Docker).

### Building

```bash
cargo build --release
```

### Running a public node on the Rome testnet

Run the node and connect to the public testnet.

```bash
cargo run --release --chain ./rome-tesnet.json
```

The `rome-testnet.json` chain file can be ontained from the [release page](https://github.com/Joystream/substrate-node-joystream/releases/tag/v2.1.2)


### Installing a release build
This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
cargo install --path ./
```

Now you can run

```bash
joystream-node --chain rome-testnet.json
```

## Development

### Running a local development node

```bash
cargo run --release -- --dev
```

### Cleaning development chain data
When making changes to the runtime library remember to purge the chain after rebuilding the node to test the new runtime.

```bash
cargo run --release -- purge-chain --dev
```

### Docker

#### Building localy

A joystream-node can be compiled with given [Dockerfile](./Dockerfile) file:

```bash
# Build and tag a new image, which will compile joystream-node from source
docker build . -t joystream-node

# run a development chain with the image just created publishing the websocket port
docker run -p 9944:9944 joystream-node --dev --ws-external
```

#### Downloading joystream pre-built images from Docker Hub

```bash
docker pull joystream/node
```

#### Running a public node as a service

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
