# Joystream [![Build Status](https://travis-ci.org/Joystream/joystream.svg?branch=master)](https://travis-ci.org/Joystream/joystream)

This is the main code repository for all Joystream software. In the repository you will find all the software required to run a Joystream network: The Joystream full node, runtime and all reusable substrate runtime modules that make up the Joystream runtime. In addition to all front-end apps and infrastructure servers necessary for operating the network.

## Build Status

Development [![Development Branch Build Status](https://travis-ci.org/Joystream/joystream.svg?branch=development)](https://travis-ci.org/Joystream/joystream)

More detailed build history on [Travis CI](https://travis-ci.org/github/Joystream/joystream/builds)

## Overview

The Joystream network builds on a pre-release version of [substrate v2.0](https://substrate.dev/) and adds additional
functionality to support the [various roles](https://www.joystream.org/roles) that can be entered into on the platform.

## Development
Instructions on setting up software development tools
rust toolchain / rustup
yarn and node
docker
ansible

configuring VSCode workspace settings put it in devops/vscode/settings.json
simple script copy to root .vscode/ if doesn't exist.. one time setup? or more advanced
to update it when new eslint project paths are added?

running setup.sh
any other scripts?

yarn install
git hooks

### Branching model

### Contributing
PRs
code-style, linting

### Licence

### Software Components

#### Blockchain infrastructure
Joystream Node - Full node
Runtime
Runtime modules

### Server Applications

### Client Applications

### Tools


## Current Active testnet
To test your setup, lets join the current live testnet..
Current Live testnet - Rome chain

## Exploring the network with Pioneer
git checkout master
- visit https://testnet.joystream.org
- run local version of pioneer
  build pioneer open local

## Running a local full node
git chekout master
build from source or pre-built binaries?
copy chainspec.json from releases into testnets/chains/current ->
include archival pruning mode so proposals pages works correctly
then redirect pioneer to point at local node

Run the node and connect to the public testnet.

```bash
cargo run --release -- --chain ./testnets/rome-testnet.json
```

The `rome-testnet.json` chain file can be obtained from the [releases page](https://github.com/Joystream/joystream/releases/tag/v6.8.0)

[More details](node/README.md)

[Link to more advanced guides on participating on network](blog post/guides?)

## Contributing

Please see our [contributing guidelines](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

Link to github issue on branching model?

## Authors

See also the list of [CONTRIBUTORS](https://github.com/Joystream/joystream/graphs/contributors) who participated in this project.

## License

This project is licensed under the GPLv3 License - see the [LICENSE](./LICENSE) file for details

## Acknowledgments

Thanks to the whole [Parity Tech](https://www.parity.io/) team for making substrate and helping on riot chat with tips, suggestions, tutorials and answering all our questions during development.
