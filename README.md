# Joystream

This is the main code repository for all Joystream software. In this mono-repo you will find all the software required to run a Joystream network: The Joystream full node, runtime and all reusable substrate runtime modules that make up the Joystream runtime. In addition to all front-end apps and infrastructure servers necessary for operating the network.

## Overview

The Joystream network builds on the [substrate](https://substrate.io/) blockchain framework, and adds additional
functionality to support the [various roles](https://joystream.gitbook.io/testnet-workspace/system/working-groups) that can be entered into on the platform.

## Development

For best results use GNU/Linux with minimum glibc version 2.28 for nodejs v18 to work.
So Ubuntu 20.04 or newer.

You can check your version of glibc with `ldd --version`

The following tools are required for building, testing and contributing to this repo:

- [Rust](https://www.rust-lang.org/tools/install) toolchain - _required_
- [nodejs](https://nodejs.org/) >= v14.18.x - _required_ (However volta will try to use v18.6)
- [yarn classic](https://classic.yarnpkg.com/en/docs/install) package manager v1.22.x- _required_
- [docker](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository) v2.20.x or higher - _required_
- [ansible](https://www.ansible.com/) - _optional_

If you use VSCode as your code editor we recommend using the workspace [settings](devops/vscode/settings.json) for recommend eslint plugin to function properly.

After cloning the repo run the following to get started:

### Install development tools
```sh
./setup.sh
```

### If you prefer your own node version manager
Install development tools without Volta version manager.

```sh
./setup.sh --no-volta
```

### For older operating systems which don't support node 18
Modify the root `package.json` and change volta section to use node version 16.20.1 instead of 18.6.0
```json
"volta": {
    "node": "16.20.1",
    "yarn": "1.22.19"
}
```

### Run local development network

```sh
# Build local npm packages
yarn build

# Build joystream/node docker testing image
RUNTIME_PROFILE=TESTING yarn build:node:docker

# Start a local development network
yarn start
```

## Software

**Substrate blockchain**

- [joystream-node](./bin/node)
- [runtime](./runtime)
- [runtime modules](./runtime-modules)

**Server Applications - infrastructure**

- [Storage Node](./storage-node) - Media Storage Infrastructure
- [Query Node](./query-node)
- [Distributor Node](./distributor-node)

**Front-end Applications**

- [Pioneer v2](https://github.com/Joystream/pioneer) - Main UI for accessing Joystream community and governance features
- [Atlas](https://github.com/Joystream/atlas) - Media Player

**Tools and CLI**

- [joystream-cli](./cli) - CLI for community and governance activities

**Testing infrastructure**

- [Network integration](./tests/network-tests) - Joystream network integration testing framework

## Running a local full node

```sh
git checkout master
WASM_BUILD_TOOLCHAIN=nightly-2022-11-15 cargo build --release
./target/release/joystream-node -- --pruning archive --chain joy-mainnet.json
```

Learn more about [joystream-node](bin/node/README.md).

A step by step guide to setup a full node and validator on the Joystream main network, can be found [here](https://handbook.joystream.org/system/validation).

### Pre-built joystream-node binaries
Look under the 'Assets' section:

- Ephesus release [v8.3.0](https://github.com/Joystream/joystream/releases/tag/v12.2001.0)

### Mainnet chainspec file
- [joy-mainnet.json](https://github.com/Joystream/joystream/releases/download/v12.1000.0/joy-mainnet.json)

### Integration tests

```bash
# Make sure yarn packages are built
yarn build

# Build the test joystream-node
RUNTIME_PROFILE=TESTING yarn build:node:docker

# Run tests
yarn test
```

### Contributing

We have lots of good first [issues](https://github.com/Joystream/joystream/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) open to help you get started on contributing code. If you are not a developer you can still make valuable contributions by testing our software and providing feedback and opening new issues.

A description of our [branching model](https://github.com/Joystream/joystream/issues/638) will help you to understand where work on different software components happens, and consequently where to direct your pull requests.

We rely on `eslint` for code quality of our JavaScript and TypeScript code and `prettier` for consistent formatting. For Rust we rely on `rustfmt` and `clippy`.

The [husky](https://www.npmjs.com/package/husky#ci-servers) npm package is used to manage the project git-hooks. This is automatically installed and setup when you run `yarn install`.

When you `git commit` and `git push` some scripts will run automatically to ensure committed code passes lint, tests, and code-style checks.

During a rebase/merge you may want to skip all hooks, you can use `HUSKY_SKIP_HOOKS` environment variable.

```
HUSKY_SKIP_HOOKS=1 git rebase ...
```

## RLS Extension in VScode or Atom Editors

If you use RLS extension in your IDE, start your editor with the `BUILD_DUMMY_WASM_BINARY=1` environment set to workaround a build issue that occurs in the IDE only.

`BUILD_DUMMY_WASM_BINARY=1 code ./joystream`

## Authors

See the list of [contributors](https://github.com/Joystream/joystream/graphs/contributors) who participated in this project.

## License

All software under this project is licensed as [GPLv3](./LICENSE) unless otherwise indicated.

## Acknowledgments

Thanks to the whole [Parity Tech](https://www.parity.io/) team for making substrate and helping in chat with tips, suggestions, tutorials and answering all our questions during development.
