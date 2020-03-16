![ Nodes for Joystream](./validator-node_new.svg)

# Joystream Full Node

Joystream node built on top of [Substrate](https://github.com/paritytech/substrate).

Follow the instructions below to download the software or build it from source. Further instructions for windows and mac can be found [here.](https://blog.joystream.org/sparta/)
Linux should be similar to mac.

##  Binary releases
Downloads are available in [releases](https://github.com/Joystream/substrate-node-joystream/releases).

## Building from source

### Initial setup
If you want to build from source you will need the Rust [toolchain](https://rustup.rs/), openssl and llvm/libclang. You can install the required dependencies with:

```bash
git clone https://github.com/Joystream/substrate-node-joystream.git
cd substrate-node-joystream/
./setup.sh
```

If you prefer to use docker see [building with docker](Docker).

### Building

```bash
cargo build --release
```

### Running a public node

Run the node and connect to the public testnet
```bash
cargo run --release --chain chain-file.json
```

The chain file for the required testnet is also avilable on the [releases](https://github.com/Joystream/substrate-node-joystream/releases) page.

The current public testnet is Rome. So you would download the rome-testnet.json file to use.

### Installing a release build
This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
cargo install --path ./
```

Now you can run

```bash
joystream-node --chain chain-file.json
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

Download the [Rome Testnet chain file](https://github.com/Joystream/substrate-node-joystream/releases/download/v2.1.2/rome-tesnet.json)

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
