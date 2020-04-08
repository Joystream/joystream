joystream-cli
=============

Command Line Interface for Joystream community and governance activities

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/joystream-cli.svg)](https://npmjs.org/package/joystream-cli)
[![Downloads/week](https://img.shields.io/npm/dw/joystream-cli.svg)](https://npmjs.org/package/joystream-cli)
[![License](https://img.shields.io/npm/l/joystream-cli.svg)](https://github.com/Joystream/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g joystream-cli
$ joystream-cli COMMAND
running command...
$ joystream-cli (-v|--version|version)
joystream-cli/0.0.0 linux-x64 node-v13.12.0
$ joystream-cli --help [COMMAND]
USAGE
  $ joystream-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`joystream-cli account:choose`](#joystream-cli-accountchoose)
* [`joystream-cli account:import BACKUPFILEPATH`](#joystream-cli-accountimport-backupfilepath)
* [`joystream-cli council:info`](#joystream-cli-councilinfo)
* [`joystream-cli help [COMMAND]`](#joystream-cli-help-command)

## `joystream-cli account:choose`

Choose current account to use in the CLI

```
USAGE
  $ joystream-cli account:choose
```

_See code: [src/commands/account/choose.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/choose.ts)_

## `joystream-cli account:import BACKUPFILEPATH`

Import account using JSON backup file

```
USAGE
  $ joystream-cli account:import BACKUPFILEPATH

ARGUMENTS
  BACKUPFILEPATH  Path to account backup JSON file
```

_See code: [src/commands/account/import.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/import.ts)_

## `joystream-cli council:info`

Get current council and council elections information

```
USAGE
  $ joystream-cli council:info
```

_See code: [src/commands/council/info.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/council/info.ts)_

## `joystream-cli help [COMMAND]`

display help for joystream-cli

```
USAGE
  $ joystream-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_
<!-- commandsstop -->
