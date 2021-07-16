@joystream/distributor-cli
==========================

Joystream distributor node CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@joystream/distributor-cli.svg)](https://npmjs.org/package/@joystream/distributor-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@joystream/distributor-cli.svg)](https://npmjs.org/package/@joystream/distributor-cli)
[![License](https://img.shields.io/npm/l/@joystream/distributor-cli.svg)](https://github.com/Joystream/joystream/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @joystream/distributor-cli
$ joystream-distributor COMMAND
running command...
$ joystream-distributor (-v|--version|version)
@joystream/distributor-cli/0.1.0 linux-x64 node-v14.17.1
$ joystream-distributor --help [COMMAND]
USAGE
  $ joystream-distributor COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`joystream-distributor help [COMMAND]`](#joystream-distributor-help-command)
* [`joystream-distributor start [CONFIG]`](#joystream-distributor-start-config)

## `joystream-distributor help [COMMAND]`

display help for joystream-distributor

```
USAGE
  $ joystream-distributor help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `joystream-distributor start [CONFIG]`

Start the node

```
USAGE
  $ joystream-distributor start [CONFIG]

ARGUMENTS
  CONFIG  [default: ./config.yml] Path to YAML configuration file

EXAMPLE
  $ joystream-distributor start
```

_See code: [src/commands/start.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/start.ts)_
<!-- commandsstop -->
