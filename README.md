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
cargo build --release
```

### Running a public node
Run the node and connect to the public testnet
```bash
cargo run --release
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

### Developing a runtime upgrade

The runtime library is in a seprate github [repo](https://github.com/joystream/substrate-runtime-joystream)

The recommended way to test a new rutime is to build it seprately and upgrade a chain. You can easily do this by calling `consensus::setCode()` with an extrinsic, either with the webui or with the subcli set-code.js script. No need to recompile the node (but use a release that matches the version of the network you are planning to upgrade and preferably with the runtime of the live chain as well), just make sure to bump the runtime spec version to be different from the native node runtime spec version.

### Developing runtime for a new chain
If the plan is to write a runtime for a new chain, and not upgrading you can take a different approach.
Then modify `Cargo.toml` in the root of this repo, edit the section: "[dependencies.joystream-node-runtime]" with the path to where you cloned the runtime repo.

Update `src/chain_spec.rs` find lines where the wasm blob is included `code: include_bytes!('../runtime/..` and modify it to point to the location where the wasm output file is compiled to.
You may need to make further changes in chain_spec to match modules added and/or removed that require chain configuration.

Build the runtime in the cloned runtime repo. Then rebuild the node. You can now run the node in development mode or use it to build a new chain spec file.

### Why can't I just just modify the code in runtime/

Mainly so you can understand how things work to avoid mistakes when preparing a new runtime upgrade for a live chain, and to separate the release process of the node software from the runtime.