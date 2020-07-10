## Validator
![ Nodes for Joystream](./node/validator-node-banner.svg)

Joystream node is the main server application that connects to the network, synchronizes the blockchain with other nodes and produces blocks if configured as a validator node.

To setup a full node and validator review the [advanced guide from the helpdesk](https://github.com/Joystream/helpdesk/tree/master/roles/validators).


###  Pre-built Binaries

The latest pre-built binaries can be downloaded from the [releases](https://github.com/Joystream/joystream/releases) page.


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


### Installing a release build
This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
cargo install joystream-node --path node/
```

Now you can run

```bash
joystream-node --chain ./rome-testnet.json
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

### Network tests

```bash
./scripts/run-test-chain.sh
yarn test
```

To run the integration tests with a different chain, you can omit step running the local development chain and set the node URL using `NODE_URL` environment variable.
Proposal grace periods should be set to 0, otherwise proposal network tests will fail.

### Rome-Constantinople migration network test

Ensure Rome node is up and running, and node URL is set using `NODE_URL` environment variable (default value is `localhost:9944`).

```bash
yarn test-migration
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
