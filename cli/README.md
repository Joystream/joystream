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
* [`joystream-cli account:create NAME`](#joystream-cli-accountcreate-name)
* [`joystream-cli account:current`](#joystream-cli-accountcurrent)
* [`joystream-cli account:export PATH`](#joystream-cli-accountexport-path)
* [`joystream-cli account:forget`](#joystream-cli-accountforget)
* [`joystream-cli account:import BACKUPFILEPATH`](#joystream-cli-accountimport-backupfilepath)
* [`joystream-cli account:transferTokens RECIPIENT AMOUNT`](#joystream-cli-accounttransfertokens-recipient-amount)
* [`joystream-cli council:info`](#joystream-cli-councilinfo)
* [`joystream-cli help [COMMAND]`](#joystream-cli-help-command)

## `joystream-cli account:choose`

Choose default account to use in the CLI

```
USAGE
  $ joystream-cli account:choose
```

_See code: [src/commands/account/choose.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/choose.ts)_

## `joystream-cli account:create NAME`

Create new account

```
USAGE
  $ joystream-cli account:create NAME

ARGUMENTS
  NAME  Account name
```

_See code: [src/commands/account/create.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/create.ts)_

## `joystream-cli account:current`

Display information about currently choosen default account

```
USAGE
  $ joystream-cli account:current

ALIASES
  $ joystream-cli account:info
  $ joystream-cli account:default
```

_See code: [src/commands/account/current.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/current.ts)_

## `joystream-cli account:export PATH`

Export account(s) to given location

```
USAGE
  $ joystream-cli account:export PATH

ARGUMENTS
  PATH  Path where the exported files should be placed

OPTIONS
  -a, --all  If provided, exports all existing accounts into "exported_accounts" folder inside given path
```

_See code: [src/commands/account/export.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/export.ts)_

## `joystream-cli account:forget`

Forget (remove) account from the list of available accounts

```
USAGE
  $ joystream-cli account:forget
```

_See code: [src/commands/account/forget.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/forget.ts)_

## `joystream-cli account:import BACKUPFILEPATH`

Import account using JSON backup file

```
USAGE
  $ joystream-cli account:import BACKUPFILEPATH

ARGUMENTS
  BACKUPFILEPATH  Path to account backup JSON file
```

_See code: [src/commands/account/import.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/import.ts)_

## `joystream-cli account:transferTokens RECIPIENT AMOUNT`

Transfer tokens from currently choosen account

```
USAGE
  $ joystream-cli account:transferTokens RECIPIENT AMOUNT

ARGUMENTS
  RECIPIENT  Address of the transfer recipient
  AMOUNT     Amount of tokens to transfer
```

_See code: [src/commands/account/transferTokens.ts](https://github.com/Joystream/cli/blob/v0.0.0/src/commands/account/transferTokens.ts)_

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
