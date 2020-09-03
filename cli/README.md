@joystream/cli
=============

Command Line Interface for Joystream community and governance activities

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![License](https://img.shields.io/npm/l/@joystream/cli.svg)](https://github.com/Joystream/joystream/blob/master/cli/package.json)

<!-- toc -->
* [Development](#development)
* [Usage](#usage)
* [First steps](#first-steps)
* [Commands](#commands)
<!-- tocstop -->

# Development
<!-- development -->
To run a command in developemnt environment (without installing the package):

1. Navigate into the CLI root directory
1. Execute any command like this:

    ```
        $ ./bin/run COMMAND
    ```

Alternatively:

1. Navigate into the CLI root directory
1. Execute `yarn link` (if that doesn't work, consider `sudo yarn link`)
1. Execute command from any location like this:

    ```
        $ joystream-cli COMMAND
    ```
<!-- development -->

# Usage
<!-- usage -->
```sh-session
$ npm install -g @joystream/cli
$ joystream-cli COMMAND
running command...
$ joystream-cli (-v|--version|version)
@joystream/cli/0.1.0 linux-x64 node-v13.12.0
$ joystream-cli --help [COMMAND]
USAGE
  $ joystream-cli COMMAND
...
```
<!-- usagestop -->

# First steps
<!-- first-steps -->
When using the CLI for the first time there are a few common steps you might want to take in order to configure the CLI:

1. Set the correct node endpoint. You can do this by executing `api:setUri` or any command that requires an api connection. To verify the current endpoint you can execute `api:getUri`.
1. In order to use the accounts/keys that you may already have access to within Pioneer, you need to dowload the backup json file(s) ([https://testnet.joystream.org/#/accounts](https://testnet.joystream.org/#/accounts)) and import them into the CLI by executing `account:import /path/to/backup.json`.
1. By executing `account:choose` you can choose one of the imported accounts, that will then serve as context for the next commands (you can check currently selected account using `account:info`). If you just want to use the development _Alice_ or _Bob_ account, you can access them without importing by providing an additional flag: `account:choose --showSpecial`.
1. The context should now be fully set up! Feel free to use the `--help` flag to investigate the available commands or take a look at the sections below.
1. You may also find it useful to get the first part of the command (before the colon) autocompleted when you press `[Tab]` while typing the name in the console. Executing `autocomplete` command will provide the instructions on how to set this up (see documentation below).
<!-- first-steps -->

# Commands
<!-- commands -->
* [`joystream-cli account:choose`](#joystream-cli-accountchoose)
* [`joystream-cli account:create NAME`](#joystream-cli-accountcreate-name)
* [`joystream-cli account:current`](#joystream-cli-accountcurrent)
* [`joystream-cli account:export PATH`](#joystream-cli-accountexport-path)
* [`joystream-cli account:forget`](#joystream-cli-accountforget)
* [`joystream-cli account:import BACKUPFILEPATH`](#joystream-cli-accountimport-backupfilepath)
* [`joystream-cli account:transferTokens RECIPIENT AMOUNT`](#joystream-cli-accounttransfertokens-recipient-amount)
* [`joystream-cli api:getUri`](#joystream-cli-apigeturi)
* [`joystream-cli api:inspect`](#joystream-cli-apiinspect)
* [`joystream-cli api:setUri [URI]`](#joystream-cli-apiseturi-uri)
* [`joystream-cli autocomplete [SHELL]`](#joystream-cli-autocomplete-shell)
* [`joystream-cli council:info`](#joystream-cli-councilinfo)
* [`joystream-cli help [COMMAND]`](#joystream-cli-help-command)
* [`joystream-cli working-groups:application WGAPPLICATIONID`](#joystream-cli-working-groupsapplication-wgapplicationid)
* [`joystream-cli working-groups:createOpening`](#joystream-cli-working-groupscreateopening)
* [`joystream-cli working-groups:decreaseWorkerStake WORKERID`](#joystream-cli-working-groupsdecreaseworkerstake-workerid)
* [`joystream-cli working-groups:evictWorker WORKERID`](#joystream-cli-working-groupsevictworker-workerid)
* [`joystream-cli working-groups:fillOpening WGOPENINGID`](#joystream-cli-working-groupsfillopening-wgopeningid)
* [`joystream-cli working-groups:increaseStake`](#joystream-cli-working-groupsincreasestake)
* [`joystream-cli working-groups:leaveRole`](#joystream-cli-working-groupsleaverole)
* [`joystream-cli working-groups:opening WGOPENINGID`](#joystream-cli-working-groupsopening-wgopeningid)
* [`joystream-cli working-groups:openings`](#joystream-cli-working-groupsopenings)
* [`joystream-cli working-groups:overview`](#joystream-cli-working-groupsoverview)
* [`joystream-cli working-groups:slashWorker WORKERID`](#joystream-cli-working-groupsslashworker-workerid)
* [`joystream-cli working-groups:startAcceptingApplications WGOPENINGID`](#joystream-cli-working-groupsstartacceptingapplications-wgopeningid)
* [`joystream-cli working-groups:startReviewPeriod WGOPENINGID`](#joystream-cli-working-groupsstartreviewperiod-wgopeningid)
* [`joystream-cli working-groups:terminateApplication WGAPPLICATIONID`](#joystream-cli-working-groupsterminateapplication-wgapplicationid)
* [`joystream-cli working-groups:updateRewardAccount [ACCOUNTADDRESS]`](#joystream-cli-working-groupsupdaterewardaccount-accountaddress)
* [`joystream-cli working-groups:updateRoleAccount [ACCOUNTADDRESS]`](#joystream-cli-working-groupsupdateroleaccount-accountaddress)
* [`joystream-cli working-groups:updateWorkerReward WORKERID`](#joystream-cli-working-groupsupdateworkerreward-workerid)

## `joystream-cli account:choose`

Choose default account to use in the CLI

```
USAGE
  $ joystream-cli account:choose

OPTIONS
  --showSpecial  Whether to show special (DEV chain) accounts
```

_See code: [src/commands/account/choose.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/choose.ts)_

## `joystream-cli account:create NAME`

Create new account

```
USAGE
  $ joystream-cli account:create NAME

ARGUMENTS
  NAME  Account name
```

_See code: [src/commands/account/create.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/create.ts)_

## `joystream-cli account:current`

Display information about currently choosen default account

```
USAGE
  $ joystream-cli account:current

ALIASES
  $ joystream-cli account:info
  $ joystream-cli account:default
```

_See code: [src/commands/account/current.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/current.ts)_

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

_See code: [src/commands/account/export.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/export.ts)_

## `joystream-cli account:forget`

Forget (remove) account from the list of available accounts

```
USAGE
  $ joystream-cli account:forget
```

_See code: [src/commands/account/forget.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/forget.ts)_

## `joystream-cli account:import BACKUPFILEPATH`

Import account using JSON backup file

```
USAGE
  $ joystream-cli account:import BACKUPFILEPATH

ARGUMENTS
  BACKUPFILEPATH  Path to account backup JSON file
```

_See code: [src/commands/account/import.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/import.ts)_

## `joystream-cli account:transferTokens RECIPIENT AMOUNT`

Transfer tokens from currently choosen account

```
USAGE
  $ joystream-cli account:transferTokens RECIPIENT AMOUNT

ARGUMENTS
  RECIPIENT  Address of the transfer recipient
  AMOUNT     Amount of tokens to transfer
```

_See code: [src/commands/account/transferTokens.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/account/transferTokens.ts)_

## `joystream-cli api:getUri`

Get current api WS provider uri

```
USAGE
  $ joystream-cli api:getUri
```

_See code: [src/commands/api/getUri.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/getUri.ts)_

## `joystream-cli api:inspect`

Lists available node API modules/methods and/or their description(s), or calls one of the API methods (depending on provided arguments and flags)

```
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
  $ api:inspect -t=query -M=members -m=membershipById
  $ api:inspect -t=query -M=members -m=membershipById -e
  $ api:inspect -t=query -M=members -m=membershipById -e -a=1
```

_See code: [src/commands/api/inspect.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/inspect.ts)_

## `joystream-cli api:setUri [URI]`

Set api WS provider uri

```
USAGE
  $ joystream-cli api:setUri [URI]

ARGUMENTS
  URI  Uri of the node api WS provider (if skipped, a prompt will be displayed)
```

_See code: [src/commands/api/setUri.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/api/setUri.ts)_

## `joystream-cli autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ joystream-cli autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ joystream-cli autocomplete
  $ joystream-cli autocomplete bash
  $ joystream-cli autocomplete zsh
  $ joystream-cli autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.2.0/src/commands/autocomplete/index.ts)_

## `joystream-cli council:info`

Get current council and council elections information

```
USAGE
  $ joystream-cli council:info
```

_See code: [src/commands/council/info.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/council/info.ts)_

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

## `joystream-cli working-groups:application WGAPPLICATIONID`

Shows an overview of given application by Working Group Application ID

```
USAGE
  $ joystream-cli working-groups:application WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/application.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/application.ts)_

## `joystream-cli working-groups:createOpening`

Create working group opening (requires lead access)

```
USAGE
  $ joystream-cli working-groups:createOpening

OPTIONS
  -c, --createDraftOnly      If provided - the extrinsic will not be executed. Use this flag if you only want to create
                             a draft.

  -d, --useDraft             Whether to create the opening from existing draft.
                             If provided without --draftName - the list of choices will be displayed.

  -g, --group=group          (required) [default: storageProviders] The working group context in which the command
                             should be executed
                             Available values are: storageProviders.

  -n, --draftName=draftName  Name of the draft to create the opening from.

  -s, --skipPrompts          Whether to skip all prompts when adding from draft (will use all default values)
```

_See code: [src/commands/working-groups/createOpening.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/createOpening.ts)_

## `joystream-cli working-groups:decreaseWorkerStake WORKERID`

Decreases given worker stake by an amount that will be returned to the worker role account. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:decreaseWorkerStake WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/decreaseWorkerStake.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/decreaseWorkerStake.ts)_

## `joystream-cli working-groups:evictWorker WORKERID`

Evicts given worker. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:evictWorker WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/evictWorker.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/evictWorker.ts)_

## `joystream-cli working-groups:fillOpening WGOPENINGID`

Allows filling working group opening that's currently in review. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:fillOpening WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/fillOpening.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/fillOpening.ts)_

## `joystream-cli working-groups:increaseStake`

Increases current role (lead/worker) stake. Requires active role account to be selected.

```
USAGE
  $ joystream-cli working-groups:increaseStake

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/increaseStake.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/increaseStake.ts)_

## `joystream-cli working-groups:leaveRole`

Leave the worker or lead role associated with currently selected account.

```
USAGE
  $ joystream-cli working-groups:leaveRole

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/leaveRole.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/leaveRole.ts)_

## `joystream-cli working-groups:opening WGOPENINGID`

Shows an overview of given working group opening by Working Group Opening ID

```
USAGE
  $ joystream-cli working-groups:opening WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/opening.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/opening.ts)_

## `joystream-cli working-groups:openings`

Shows an overview of given working group openings

```
USAGE
  $ joystream-cli working-groups:openings

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/openings.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/openings.ts)_

## `joystream-cli working-groups:overview`

Shows an overview of given working group (current lead and workers)

```
USAGE
  $ joystream-cli working-groups:overview

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/overview.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/overview.ts)_

## `joystream-cli working-groups:slashWorker WORKERID`

Slashes given worker stake. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:slashWorker WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/slashWorker.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/slashWorker.ts)_

## `joystream-cli working-groups:startAcceptingApplications WGOPENINGID`

Changes the status of pending opening to "Accepting applications". Requires lead access.

```
USAGE
  $ joystream-cli working-groups:startAcceptingApplications WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/startAcceptingApplications.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/startAcceptingApplications.ts)_

## `joystream-cli working-groups:startReviewPeriod WGOPENINGID`

Changes the status of active opening to "In review". Requires lead access.

```
USAGE
  $ joystream-cli working-groups:startReviewPeriod WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/startReviewPeriod.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/startReviewPeriod.ts)_

## `joystream-cli working-groups:terminateApplication WGAPPLICATIONID`

Terminates given working group application. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:terminateApplication WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/terminateApplication.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/terminateApplication.ts)_

## `joystream-cli working-groups:updateRewardAccount [ACCOUNTADDRESS]`

Updates the worker/lead reward account (requires current role account to be selected)

```
USAGE
  $ joystream-cli working-groups:updateRewardAccount [ACCOUNTADDRESS]

ARGUMENTS
  ACCOUNTADDRESS  New reward account address (if omitted, one of the existing CLI accounts can be selected)

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/updateRewardAccount.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/updateRewardAccount.ts)_

## `joystream-cli working-groups:updateRoleAccount [ACCOUNTADDRESS]`

Updates the worker/lead role account. Requires member controller account to be selected

```
USAGE
  $ joystream-cli working-groups:updateRoleAccount [ACCOUNTADDRESS]

ARGUMENTS
  ACCOUNTADDRESS  New role account address (if omitted, one of the existing CLI accounts can be selected)

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/updateRoleAccount.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/updateRoleAccount.ts)_

## `joystream-cli working-groups:updateWorkerReward WORKERID`

Change given worker's reward (amount only). Requires lead access.

```
USAGE
  $ joystream-cli working-groups:updateWorkerReward WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=group  (required) [default: storageProviders] The working group context in which the command should be
                     executed
                     Available values are: storageProviders.
```

_See code: [src/commands/working-groups/updateWorkerReward.ts](https://github.com/Joystream/substrate-runtime-joystream/blob/master/cli/src/commands/working-groups/updateWorkerReward.ts)_
<!-- commandsstop -->
