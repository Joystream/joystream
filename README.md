![Storage Nodes for Joystream](./banner.svg)

This repository contains several Node packages, located under the `packages/`
subdirectory. See each individual package for details:

* [colossus](./packages/colossus/README.md) - the main colossus app.
* [storage](./packages/storage/README.md) - abstraction over the storage backend.
* [runtime-api](./packages/runtime-api/README.md) - convenience wrappers for the runtime API.
* [crypto](./packages/crypto/README.md) - cryptographic utility functions.
* [util](./packages/util/README.md) - general utility functions.

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

Storage Provider Staking
------------------------

Staking for the storage provider role happens in a few simple steps:

1. Using [the app](https://github.com/Joystream/apps), create an account and make
   it a member. Make sure to save the JSON file. Not only is this account your
   identity, the file is also needed for the signup process. Make sure the account
   has some currency.
   - You need some currency to become a member.
   - You need to stake some currency to become a storage provider.
   - There's a transaction fee for applying as a storage provider.
1. Using the `colossus` cli, run the signup process:
   ```bash
   $ colossus signup MEMBER_ADDRESS.json
   Enter passphrase for MEMBER_ADDRESS: asdf
   Account is working for staking, proceeding.
   Generated  ROLE_ADDRESS - this is going to be exported to a JSON file.
     You can provide an empty passphrase to make starting the server easier,
     but you must keep the file very safe, then.
   Enter passphrase for ROLE_ADDRESS:
   Identity stored in ROLE_ADDRESS.json
   Funds transferred.
   Role application sent.
   ```
1. The newly created account is also saved to a JSON file. This is the account
   you use for running the storage node. Funds will be transferred from the member
   account to the role account, and an application to stake for the role will be
   created.
1. Navigate to the `Roles` menu entry of the app. If you're currently the member
   account, you should see the role application under the `MyRequests` tab.
1. Stake for the role.
1. Back with the CLI, run the server:
   ```bash
   $ colossus --key-file ROLE_ADDRESS.json
   ```

Note that the JSON files contain the full key pair of either account. It's best
to protect them with a passphrase. If you want to run the `colossus` server
more easily, you can also provide an empty passphrase when the JSON file is
created - but be aware that you must then take extra care to secure this file!
