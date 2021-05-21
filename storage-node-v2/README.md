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
storage-node-v2/0.1.0 darwin-x64 node-v14.8.0
$ storage-node --help [COMMAND]
USAGE
  $ storage-node COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`storage-node help [COMMAND]`](#storage-node-help-command)
* [`storage-node leader:create-bucket`](#storage-node-leadercreate-bucket)
* [`storage-node leader:update-bags [FILE]`](#storage-node-leaderupdate-bags-file)
* [`storage-node operator:accept-invitation [FILE]`](#storage-node-operatoraccept-invitation-file)

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `storage-node leader:create-bucket`

Create new storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:create-bucket

OPTIONS
  -a, --allow            Accepts new bags
  -d, --dev              Use development mode
  -h, --help             show CLI help
  -i, --invited=invited  Invited storage operator ID (storage WG worker ID)
  -n, --number=number    Storage bucket max total objects number
  -s, --size=size        Storage bucket max total objects size
```

_See code: [src/commands/leader/create-bucket.ts](https://github.com/shamil-gadelshin/storage-node-v2/blob/v0.1.0/src/commands/leader/create-bucket.ts)_

## `storage-node leader:update-bags [FILE]`

describe the command here

```
USAGE
  $ storage-node leader:update-bags [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/leader/update-bags.ts](https://github.com/shamil-gadelshin/storage-node-v2/blob/v0.1.0/src/commands/leader/update-bags.ts)_

## `storage-node operator:accept-invitation [FILE]`

Accept pending storage bucket invitation.

```
USAGE
  $ storage-node operator:accept-invitation [FILE]

OPTIONS
  -b, --bucket=bucket  (required) Storage bucket ID
  -d, --dev            Use development mode
  -h, --help           show CLI help
  -w, --worker=worker  (required) Storage operator worker ID
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/shamil-gadelshin/storage-node-v2/blob/v0.1.0/src/commands/operator/accept-invitation.ts)_
<!-- commandsstop -->
