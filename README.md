![Storage Nodes for Joystream](./storage-node_new.svg)

This repository contains several Node packages, located under the `packages/`
subdirectory. See each individual package for details:

* [colossus](./packages/colossus/README.md) - the main colossus app.
* [storage](./packages/storage/README.md) - abstraction over the storage backend.
* [runtime-api](./packages/runtime-api/README.md) - convenience wrappers for the runtime API.
* [crypto](./packages/crypto/README.md) - cryptographic utility functions.
* [util](./packages/util/README.md) - general utility functions.
* [discovery](./packages/discovery/README.md) - service discovery using IPNS.

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
$ yarn run colossus --help
```

*Testing*

Running tests from the repository root will run tests from all packages:

```
$ yarn run test
```


## Detailed Setup and Configuration Guide
For details on how to setup a storage node on the Joystream network, follow this [step by step guide](https://github.com/Joystream/helpdesk/tree/master/roles/storage-providers).
