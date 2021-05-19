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
* [`storage-node hello [FILE]`](#storage-node-hello-file)
* [`storage-node help [COMMAND]`](#storage-node-help-command)

## `storage-node hello [FILE]`

describe the command here

```
USAGE
  $ storage-node hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ storage-node hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/shamil-gadelshin/storage-node-v2/blob/v0.1.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
