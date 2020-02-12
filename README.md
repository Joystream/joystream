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

### Building

```bash
cargo build --release
```

### Running a public node

Run the node and connect to the public testnet
```bash
cargo run --release
```

### Installing a release build
This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
cargo install --path ./
```

Now you can run

```bash
joystream-node
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

### Docker - experimental

A joystream-node can be run in a docker container using the provided [Dockerfile](Dockerfile):

```bash
# Build and tag a new docker image, which will compile joystream-node from source
# The image is specifically made run joystream-node full node inside a container.
docker build . -t joystream-node
# run a development chain by launching a new docker container, publishing the websocket port
docker run -p 9944:9944 joystream-node --dev --ws-external
```
