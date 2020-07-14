![Storage Nodes for Joystream](./storage-node_new.svg)

This repository contains several Node packages, located under the `packages/`
subdirectory. See each individual package for details:

* [colossus](./packages/colossus/README.md) - the main colossus app.
* [storage-node-backend](./packages/storage/README.md) - abstraction over the storage backend.
* [storage-runtime-api](./packages/runtime-api/README.md) - convenience wrappers for the runtime API.
* [storage-utils](./packages/util/README.md) - general utility functions.
* [discovery](./packages/discovery/README.md) - service discovery using IPNS.
* [storage-cli](./packages/cli/README.md) - cli for uploading and downloading content from the network

Installation
------------

*Requirements*

This project uses [yarn](https://yarnpkg.com/) as Node package manager. It also
uses some node packages with native components, so make sure to install your
system's basic build tools.

On Debian-based systems:

```bash
$ apt install build-essential
```

On Mac OS (using [homebrew](https://brew.sh/)):

```bash
$ brew install libtool automake autoconf
```

*Building*

```bash
$ yarn install
```

The command will install dependencies, and make a `colossus` executable available:

```bash
$ yarn colossus --help
```

*Testing*

Run an ipfs node and a joystream-node development chain (in separate terminals)

```sh
ipfs daemon
```

```sh
joystream-node --dev
```

```sh
$ yarn workspace storage-node test
```

Running a development environment, after starting the ipfs node and development chain

```sh
yarn storage-cli dev-init
```

This will configure the running chain with alice as the storage lead and with a know role key for
the storage provider.

Run colossus in development mode:

```sh
yarn colossus --dev
```

Start pioneer ui:
``sh
yarn workspace pioneer start
```

Browse pioneer on http://localhost:3000/
You should find Alice account is the storage working group lead and is a storage provider
Create a media channel. And upload a file.

## Detailed Setup and Configuration Guide
For details on how to setup a storage node on the Joystream network, follow this [step by step guide](https://github.com/Joystream/helpdesk/tree/master/roles/storage-providers).
