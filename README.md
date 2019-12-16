![Joystream Runtime](./banner_new.svg)

# Joystream Runtime

The runtime is the code that defines the consensus rules of the Joystream protocol.
It is compiled to WASM and lives on chain. [Full nodes](https://github.com/Joystream/substrate-node-joystream) execute the code's logic to validate transactions and blocks on the blockchain.

The joystream runtime builds on [substrate v1.0](https://docs.substrate.dev/docs) and adds additional functionality:

- [Council elections](src/governance/election.rs)
- [Runtime Upgrade proposal system](src/governance/proposals.rs)
- [User membership system](src/membership/)
- [Staked Roles](src/roles)
   - [Storage Provider](src/storage/)

### Prerequisites

To compile the runtime you will need some tools such as: Rust, llvm and openssl. You can install most of the dependencies with:

```bash
curl https://getsubstrate.io -sSf | bash -s -- --fast
```

## Getting Started - Building the WASM runtime

```bash
git clone https://github.com/Joystream/substrate-runtime-joystream
cd substrate-runtime-joystream/
./setup.sh
cargo build --release
```

This produces the WASM "blob" output in:

`target/release/wbuild/joystream-node-runtime/joystream_node_runtime.compact.wasm`

See deployment for notes on how to deploy this runtime on a live system.

## Deployment

Deploying the compiled runtime on a live system can be done in one of two ways:

1. Joystream runtime upgrade proposals which will be voted on by the council. When the Joystream platform is live, this will be the only way to upgrade the chain's runtime code.

2. During development and testnet phases, we can send an extrinsic (transaction signed with the sudo key) invoking `conesnsus::setCode()`. This can be done either from the UI/extrinsics app, or directly with an admin script.

## Running the tests

```bash
cargo test
```

### Coding style

We use `rustfmt` to format the source code for consistency.

[rustfmt](https://github.com/rust-lang/rustfmt) can be installed with rustup:

```
rustup component add rustfmt
```

Running rustfmt can be applied to all source files recursing subfolders:

```
rustfmt src/*.*
```

## Built With

* [Substrate](https://github.com/paritytech/substrate)

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

Versioning of the runtime is set in `src/lib.rs`
For detailed information about how to set correct version numbers when developing a new runtime, [see this](https://github.com/paritytech/substrate/blob/master/core/sr-version/src/lib.rs#L60)


## Authors

See also the list of [contributors](./CONTRIBUTORS) who participated in this project.

## License

This project is licensed under the GPLv3 License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

Thanks to the whole [Parity Tech](https://www.parity.io/) team for making substrate and helping on riot chat with tips, suggestions, tutorials and answering all our questions during development.

