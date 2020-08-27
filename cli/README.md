# README

## joystream-cli

Command Line Interface for Joystream community and governance activities

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io) [![Version](https://img.shields.io/npm/v/joystream-cli.svg)](https://npmjs.org/package/joystream-cli) [![Downloads/week](https://img.shields.io/npm/dw/joystream-cli.svg)](https://npmjs.org/package/joystream-cli) [![License](https://img.shields.io/npm/l/joystream-cli.svg)](https://github.com/Joystream/cli/blob/master/package.json)

* [Development](./#development)
* [Usage](./#usage)
* [Commands](./#commands)

## Development

To run a command in developemnt environment \(without installing the package\):

1. Navigate into the CLI root directory
2. Either execute any command like this:

   ```text
        $ ./bin/run COMMAND
   ```

   Or use:

   ```text
        $ npm link
   ```

   And then execute any command like this:

   ```text
        $ joystream-cli COMMAND
   ```

## Usage

```text
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

## Commands

* [`joystream-cli account:choose`](./#joystream-cli-accountchoose)
* [`joystream-cli account:create NAME`](./#joystream-cli-accountcreate-name)
* [`joystream-cli account:current`](./#joystream-cli-accountcurrent)
* [`joystream-cli account:export PATH`](./#joystream-cli-accountexport-path)
* [`joystream-cli account:forget`](./#joystream-cli-accountforget)
* [`joystream-cli account:import BACKUPFILEPATH`](./#joystream-cli-accountimport-backupfilepath)
* [`joystream-cli account:transferTokens RECIPIENT AMOUNT`](./#joystream-cli-accounttransfertokens-recipient-amount)
* [`joystream-cli api:getUri`](./#joystream-cli-apigeturi)
* [`joystream-cli api:inspect`](./#joystream-cli-apiinspect)
* [`joystream-cli api:setUri URI`](./#joystream-cli-apiseturi-uri)
* [`joystream-cli council:info`](./#joystream-cli-councilinfo)
* [`joystream-cli help [COMMAND]`](./#joystream-cli-help-command)

### `joystream-cli account:choose`

Choose default account to use in the CLI

```text
USAGE
  $ joystream-cli account:choose
```

_See code:_ [_src/commands/account/choose.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/choose.ts)

### `joystream-cli account:create NAME`

Create new account

```text
USAGE
  $ joystream-cli account:create NAME

ARGUMENTS
  NAME  Account name
```

_See code:_ [_src/commands/account/create.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/create.ts)

### `joystream-cli account:current`

Display information about currently choosen default account

```text
USAGE
  $ joystream-cli account:current

ALIASES
  $ joystream-cli account:info
  $ joystream-cli account:default
```

_See code:_ [_src/commands/account/current.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/current.ts)

### `joystream-cli account:export PATH`

Export account\(s\) to given location

```text
USAGE
  $ joystream-cli account:export PATH

ARGUMENTS
  PATH  Path where the exported files should be placed

OPTIONS
  -a, --all  If provided, exports all existing accounts into "exported_accounts" folder inside given path
```

_See code:_ [_src/commands/account/export.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/export.ts)

### `joystream-cli account:forget`

Forget \(remove\) account from the list of available accounts

```text
USAGE
  $ joystream-cli account:forget
```

_See code:_ [_src/commands/account/forget.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/forget.ts)

### `joystream-cli account:import BACKUPFILEPATH`

Import account using JSON backup file

```text
USAGE
  $ joystream-cli account:import BACKUPFILEPATH

ARGUMENTS
  BACKUPFILEPATH  Path to account backup JSON file
```

_See code:_ [_src/commands/account/import.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/import.ts)

### `joystream-cli account:transferTokens RECIPIENT AMOUNT`

Transfer tokens from currently choosen account

```text
USAGE
  $ joystream-cli account:transferTokens RECIPIENT AMOUNT

ARGUMENTS
  RECIPIENT  Address of the transfer recipient
  AMOUNT     Amount of tokens to transfer
```

_See code:_ [_src/commands/account/transferTokens.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/transferTokens.ts)

### `joystream-cli api:getUri`

Get current api WS provider uri

```text
USAGE
  $ joystream-cli api:getUri
```

_See code:_ [_src/commands/api/getUri.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/getUri.ts)

### `joystream-cli api:inspect`

Lists available node API modules/methods and/or their description\(s\), or calls one of the API methods \(depending on provided arguments and flags\)

```text
USAGE
  $ joystream-cli api:inspect

OPTIONS
  -M, --module=module
      Specifies the api module, ie. "system", "staking" etc.
      If no "--method" flag is provided then all methods in that module will be listed along with the descriptions.

  -a, --callArgs=callArgs
      Specifies the arguments to use when calling a method. Multiple arguments can be separated with a comma, ie. 
      "-a=arg1,arg2".
      You can omit this flag even if the method requires some aguments.
      In that case you will be promted to provide value for each required argument.
      Ommiting this flag is recommended when input parameters are of more complex types (and it's hard to specify them as 
      just simple comma-separated strings)

  -e, --exec
      Provide this flag if you want to execute the actual call, instead of displaying the method description (which is 
      default)

  -m, --method=method
      Specifies the api method to call/describe.

  -t, --type=type
      Specifies the type/category of the inspected request (ie. "query", "consts" etc.).
      If no "--module" flag is provided then all available modules in that type will be listed.
      If this flag is not provided then all available types will be listed.

EXAMPLES
  $ api:inspect
  $ api:inspect -t=query
  $ api:inspect -t=query -M=members
  $ api:inspect -t=query -M=members -m=memberProfile
  $ api:inspect -t=query -M=members -m=memberProfile -e
  $ api:inspect -t=query -M=members -m=memberProfile -e -a=1
```

_See code:_ [_src/commands/api/inspect.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/inspect.ts)

### `joystream-cli api:setUri URI`

Set api WS provider uri

```text
USAGE
  $ joystream-cli api:setUri URI

ARGUMENTS
  URI  Uri of the node api WS provider
```

_See code:_ [_src/commands/api/setUri.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/setUri.ts)

### `joystream-cli council:info`

Get current council and council elections information

```text
USAGE
  $ joystream-cli council:info
```

_See code:_ [_src/commands/council/info.ts_](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/council/info.ts)

### `joystream-cli help [COMMAND]`

display help for joystream-cli

```text
USAGE
  $ joystream-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code:_ [_@oclif/plugin-help_](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts) 

