storage-node-v2
===============

Jostream storage subsystem.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/storage-node-v2.svg)](https://npmjs.org/package/storage-node-v2)
[![Downloads/week](https://img.shields.io/npm/dw/storage-node-v2.svg)](https://npmjs.org/package/storage-node-v2)
[![License](https://img.shields.io/npm/l/storage-node-v2.svg)](https://github.com/shamil-gadelshin/storage-node-v2/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g storage-node-v2
$ storage-node COMMAND
running command...
$ storage-node (-v|--version|version)
storage-node-v2/0.1.0 darwin-x64 node-v14.17.0
$ storage-node --help [COMMAND]
USAGE
  $ storage-node COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`storage-node dev:init`](#storage-node-devinit)
* [`storage-node dev:upload`](#storage-node-devupload)
* [`storage-node dev:verify-bag-id [FILE]`](#storage-node-devverify-bag-id-file)
* [`storage-node help [COMMAND]`](#storage-node-help-command)
* [`storage-node leader:create-bucket`](#storage-node-leadercreate-bucket)
* [`storage-node leader:update-bag`](#storage-node-leaderupdate-bag)
* [`storage-node leader:update-bag-limit`](#storage-node-leaderupdate-bag-limit)
* [`storage-node leader:update-voucher-limits`](#storage-node-leaderupdate-voucher-limits)
* [`storage-node multihash`](#storage-node-multihash)
* [`storage-node operator:accept-invitation`](#storage-node-operatoraccept-invitation)
* [`storage-node server [FILE]`](#storage-node-server-file)

## `storage-node dev:init`

Initialize development environment. Sets Alice as storage working group leader.

```
USAGE
  $ storage-node dev:init

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/dev/init.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/init.ts)_

## `storage-node dev:upload`

Upload data object (development mode only).

```
USAGE
  $ storage-node dev:upload

OPTIONS
  -c, --cid=cid    (required) Data object IPFS content ID.
  -h, --help       show CLI help
  -s, --size=size  (required) Data object size.
```

_See code: [src/commands/dev/upload.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/upload.ts)_

## `storage-node dev:verify-bag-id [FILE]`

describe the command here

```
USAGE
  $ storage-node dev:verify-bag-id [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/dev/verify-bag-id.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/verify-bag-id.ts)_

## `storage-node help [COMMAND]`

display help for storage-node

```
USAGE
  $ storage-node help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.0.1/src/commands/help.ts)_

## `storage-node leader:create-bucket`

Create new storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:create-bucket

OPTIONS
  -a, --allow              Accepts new bags
  -d, --dev                Use development mode
  -h, --help               show CLI help
  -i, --invited=invited    Invited storage operator ID (storage WG worker ID)
  -k, --keyfile=keyfile    Key file for the account. Mandatory in non-dev environment.
  -n, --number=number      Storage bucket max total objects number
  -p, --password=password  Key file password (optional).
  -s, --size=size          Storage bucket max total objects size
```

_See code: [src/commands/leader/create-bucket.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/create-bucket.ts)_

## `storage-node leader:update-bag`

Add/remove a storage bucket from a bag (adds by default).

```
USAGE
  $ storage-node leader:update-bag

OPTIONS
  -b, --bucket=bucket
      (required) Storage bucket ID

  -d, --dev
      Use development mode

  -h, --help
      show CLI help

  -i, --bagId=bagId
      (required) 
             Bag ID. Format: {bag_type}:{sub_type}:{id}.
             - Bag types: 'static', 'dynamic'
             - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
             - Id: 
               - absent for 'static:council'
               - working group name for 'static:wg'
               - integer for 'dynamic:member' and 'dynamic:channel'
             Examples:
             - static:council
             - static:wg:storage
             - dynamic:member:4

  -k, --keyfile=keyfile
      Key file for the account. Mandatory in non-dev environment.

  -p, --password=password
      Key file password (optional).

  -r, --remove
      Remove a bucket from the bag
```

_See code: [src/commands/leader/update-bag.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-bag.ts)_

## `storage-node leader:update-bag-limit`

Updates StorageBucketsPerBagLimit variable in the Joystream node storage.

```
USAGE
  $ storage-node leader:update-bag-limit

OPTIONS
  -d, --dev                Use development mode
  -h, --help               show CLI help
  -k, --keyfile=keyfile    Key file for the account. Mandatory in non-dev environment.
  -l, --limit=limit        (required) New StorageBucketsPerBagLimit value
  -p, --password=password  Key file password (optional).
```

_See code: [src/commands/leader/update-bag-limit.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-bag-limit.ts)_

## `storage-node leader:update-voucher-limits`

Updates VoucherMaxObjectsSizeLimit and VoucherMaxObjectsNumberLimit the Joystream node storage.

```
USAGE
  $ storage-node leader:update-voucher-limits

OPTIONS
  -d, --dev                Use development mode
  -h, --help               show CLI help
  -k, --keyfile=keyfile    Key file for the account. Mandatory in non-dev environment.
  -o, --objects=objects    (required) New 'max voucher object number limit' value
  -p, --password=password  Key file password (optional).
  -s, --size=size          (required) New 'max voucher object size limit' value
```

_See code: [src/commands/leader/update-voucher-limits.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-voucher-limits.ts)_

## `storage-node multihash`

Creates a multihash (blake3) for a file.

```
USAGE
  $ storage-node multihash

OPTIONS
  -f, --file=file  (required) Path for a hashing file.
  -h, --help       show CLI help
```

_See code: [src/commands/multihash.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/multihash.ts)_

## `storage-node operator:accept-invitation`

Accept pending storage bucket invitation.

```
USAGE
  $ storage-node operator:accept-invitation

OPTIONS
  -b, --bucket=bucket      (required) Storage bucket ID
  -d, --dev                Use development mode
  -h, --help               show CLI help
  -k, --keyfile=keyfile    Key file for the account. Mandatory in non-dev environment.
  -p, --password=password  Key file password (optional).
  -w, --worker=worker      (required) Storage operator worker ID
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/operator/accept-invitation.ts)_

## `storage-node server [FILE]`

Starts the storage node server.

```
USAGE
  $ storage-node server [FILE]

OPTIONS
  -d, --dev                Use development mode
  -h, --help               show CLI help
  -k, --keyfile=keyfile    Key file for the account. Mandatory in non-dev environment.
  -p, --password=password  Key file password (optional).
  -p, --port=port          (required) Server port.
  -u, --uploads=uploads    (required) Data uploading directory.
```

_See code: [src/commands/server.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/server.ts)_
<!-- commandsstop -->
