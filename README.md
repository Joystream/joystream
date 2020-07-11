# Joystream [![Build Status](https://travis-ci.org/Joystream/joystream.svg?branch=master)](https://travis-ci.org/Joystream/joystream)

This is the main code repository for all Joystream software. In this mono-repo you will find all the software required to run a Joystream network: The Joystream full node, runtime and all reusable substrate runtime modules that make up the Joystream runtime. In addition to all front-end apps and infrastructure servers necessary for operating the network.

## Overview

The Joystream network builds on a pre-release version of [substrate v2.0](https://substrate.dev/) and adds additional
functionality to support the [various roles](https://www.joystream.org/roles) that can be entered into on the platform.

## Build Status

Development [![Development Branch Build Status](https://travis-ci.org/Joystream/joystream.svg?branch=development)](https://travis-ci.org/Joystream/joystream) - build history on [Travis](https://travis-ci.org/github/Joystream/joystream/builds)

## Development Tools
The following tools are required for building, testing and contributing to this repo:

- [Rust](https://www.rust-lang.org/tools/install) toolchain - *required*
- [nodejs](https://nodejs.org/)  v12.x - *required*
- [yarn classic](https://classic.yarnpkg.com/en/docs/install) package manager v1.22.x- *required*
- [docker](https://www.docker.com/get-started) - *optional*
- [ansible](https://www.ansible.com/) - *optional*

If you use VSCode as your code editor we recommend using the workspace [settings](devops/vscode/settings.json) for recommend eslint plugin to function properly, and to auto-fix linter and code style on save.

After cloning the repo run the following initialization scripts:

```sh
# Install rust toolchain
./setup.sh

# Install npm package dependencies
# Also good habit to run this when switching between branches
yarn install

# run some tests
yarn cargo-checks
```

## Software

**Substrate blockchain**
- [joystream-node](./node)
- [runtime](./runtime)
- [runtime modules](./runtime-modules)

**Server Applications - infrastructure**
- [Storage Node](./storage-node) - Media Storage Infrastructure
- [Query Node](https://github.com/Joystream/joystream/tree/query_node/query-node) - *under development*
- [Discovery Node](https://github.com/Joystream/joystream/tree/init_discovery_node/discovery_node) - *under development*

**Front-end Applications**
- [Pioneer](./pioneer) - Main UI for accessing all Joystream features
- [Atlas](https://github.com/Joystream/joystream/tree/init_atlas/atlas) - Media Player- *under development*

**Tools and CLI**
- [joystream-cli](./cli) - CLI for community and governance activities

**Testing infrastructure**
- [Network integration](./tests/network-tests) - Joystream network integration testing framework

## Exploring the network with Pioneer
Pioneer is currently the main web interface to interact with the network:

We currently host it on: https://testnet.joystream.org

You may have to disable some privacy/ad-blocker extensions in your browser for proper functionality, especially when browsing media.

You can also run a local development instance:

The HEAD of the master branch should always be used for the correct version of the applications to connect to the current testnet:

```sh
git checkout master
yarn install
yarn workspace pioneer start
```
This runs a local development web server on port 3000.

Use the link below to browse the network using the publicly hosted endpoint:
http://localhost:3000/?rpc=wss://rome-rpc-endpoint.joystream.org:9944/


## Running a local full node

You can also run your our own joystream-node:

```sh
git checkout master
cargo build --release
cargo run --release -- --pruning archive --chain testnets/rome.json
```

Wait for the node to sync to the latest block, then change pioneer settings "remote node" option to "Local Node", or follow the link below:

http://localhost:3000/?rpc=ws://localhost:9944/

Learn more about [joystream-node](node/README.md).

If you want to run a node as a validator on the testnet, checkout this [advanced guide](https://github.com/Joystream/helpdesk/tree/master/roles/validators).

### Contributing

We have lots of good first [issues](https://github.com/Joystream/joystream/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) open to help you get started on contributing code. If you are not a developer you can still make valuable contributions by testing our software and providing feedback and opening new issues.

A description of our [branching model](https://github.com/Joystream/joystream/issues/638) will help you understand where work on differnet software components happens, and where to direct your pull requests.

We rely on `eslint` for code quality of our javascript and typescript code, `prettier` for consistent formmating. For Rust we rely on `rustfmt` and `clippy`.

The [husky](https://www.npmjs.com/package/husky#ci-servers) npm package is used to manage the project git-hooks. This is automatically installed and setup when you run `yarn install`.

When you `git commit` and `git push` some scripts will run automatically to ensure committed code passes lint, tests, and code-style checks.

During a rebase/merge you may want to skip all hooks, you can use `HUSKY_SKIP_HOOKS` environment variable.

```
HUSKY_SKIP_HOOKS=1 git rebase ...
```

## Authors

See the list of [contributors](https://github.com/Joystream/joystream/graphs/contributors) who participated in this project.

## License

All software under this project is licensed as [GPLv3](./LICENSE) unless otherwise indicated.

## Acknowledgments

Thanks to the whole [Parity Tech](https://www.parity.io/) team for making substrate and helping in chat with tips, suggestions, tutorials and answering all our questions during development.
