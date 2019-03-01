# Joystream Substrate Node

Joystream node built on top of Substrate.

Follow the instructions below to download the software or build it from source. Further instructions for windows and mac can be found [here.](https://blog.joystream.org/sparta/)
Linux should be similar to mac.

##  Binary releases
Downloads are available in [releases](https://github.com/Joystream/substrate-node-joystream/releases).

## Building from source

### Initial setup
If you want to build from source you will need the Rust [toolchain](https://rustup.rs/), openssl and llvm/libclang.

Initialise the WASM build environment:

```bash
./init-wasm.sh
```

### Building
Checkout the correct release branch if you are planning to connect to one of the public testnets.

Build the WASM runtime library:
```bash
./build-runtime.sh
```

Build the node (native code):
```bash
cargo build
```

### Running a public node
Run the node and connect to the public testnet
```bash
cargo run
```

### Installing a release build
This will install node to your `~/.cargo/bin` folder, which you would normally have in your `$PATH` environment.

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
cargo run -- --dev
```

### Cleaning development chain data
When making changes to the runtime library remember to purge the chain after rebuilding the node to test the new runtime.

```bash
cargo run -- purge-chain --dev
```

## Tests

### Run all tests

```bash
./test-all.sh
```

### Test a specific module

Check out `./test-proposals.sh` on how to run tests for a specific module.
