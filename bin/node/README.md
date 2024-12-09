## Joystream-Node - full node/validator

![ Nodes for Joystream](./validator-node-banner.svg)

The joystream-node is the main server application that connects to the network, synchronizes the blockchain with other nodes and produces blocks if configured as a validator node.

### Pre-built binaries

The latest pre-built binaries can be downloaded from the [releases](https://github.com/Joystream/joystream/releases) page.
Generally these will be built from `master` branch and will pertain to the currently active network.

### Building from source

Clone the repository and install build tools:

```bash
git clone https://github.com/Joystream/joystream.git

cd joystream/

./setup.sh
```

Compile the node and runtime:

```bash
WASM_BUILD_TOOLCHAIN=nightly-2022-11-15 cargo +nightly-2022-11-15 build --release
```

This produces the binary in `./target/release/joystream-node`

### Running local development chain

```bash
./target/release/joystream-node --dev
```

If you repeatedly need to restart a new chain,
this script will build and run a fresh new local development chain (purging existing chain data):

```bash
./scripts/run-dev-chain.sh
```

### Joystream Public Networks

Use the `--chain` argument, and specify the path to the genesis `chain.json` file for that public network.
Here is the JSON "chain spec" file for the Joystream mainnet [joy-mainnet.json](../../joy-mainnet.json).

```bash
./target/release/joystream-node --chain joy-mainnet.json
```

### Tests and code quality

Running unit tests:

```bash
cargo +nightly-2022-11-15 test --release --all
```

Running full suite of checks, tests, formatting and linting:

```bash
yarn cargo-checks
```

Always format your rust code with `cargo fmt` before committing:

```bash
cargo fmt --all
```

### Installing a release build

If you are building a tagged release from `master` branch and want to install the executable to your path follow the step below.

This will install the executable `joystream-node` to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

```bash
# From the project root directory
WASM_BUILD_TOOLCHAIN=nightly-2022-11-15 cargo +nightly-2022-11-15 install joystream-node --path bin/node/ --locked
```

Now you can run and connect to the network:

```bash
joystream-node --chain joy-mainnet.json
```
