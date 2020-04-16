# Joystream Node [![Build Status](https://travis-ci.org/Joystream/substrate-runtime-joystream.svg?branch=master)](https://travis-ci.org/Joystream/substrate-runtime-joystream)

## Build Status

Development [![Development Branch Build Status](https://travis-ci.org/Joystream/substrate-runtime-joystream.svg?branch=development)](https://travis-ci.org/Joystream/substrate-runtime-joystream)

More detailed build history on [Travis CI](https://travis-ci.org/github/Joystream/substrate-runtime-joystream/builds)

## Validator
![ Nodes for Joystream](./validator-node-banner.svg)

Joystream node is the main server application that connects to the network, synchronizes the blockchain with other nodes and produces blocks if configured as a validator node.

To setup a full node and validator review the [advanced guide from the helpdesk](https://github.com/Joystream/helpdesk/tree/master/roles/validators).


###  Pre-built Binaries

The latest pre-built binaries can be downloads from the [releases](https://github.com/Joystream/substrate-runtime-joystream/releases) page.


### Building from source

Clone the repository and install build tools:

```bash
git clone https://github.com/Joystream/joystream.git

cd joystream/

./setup.sh
```

### Building

```bash
cargo build --release
```

### Running a public node on the Rome testnet

Run the node and connect to the public testnet.

```bash
cargo run --release -- --chain ./rome-tesnet.json
```

The `rome-testnet.json` chain file can be ontained from the [release page](https://github.com/Joystream/joystream/releases/tag/v6.8.0)


### Installing a release build
This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
cargo install joystream-node --path node/
```

Now you can run

```bash
joystream-node --chain rome-testnet.json
```

### Local development

This will build and run a fresh new local development chain purging existing one:

```bash
./scripts/run-dev-chain.sh
```

### Unit tests

```bash
cargo test
```


## Coding style

We use `cargo-fmt` to format the source code for consistency.

It should be available on your machine if you ran the `setup.sh` script, otherwise install it with rustup:

```bash
rustup component add rustfmt
```

Applying code formatting on all source files recursing subfolders:

```
cargo-fmt
```
