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
@joystream/cli/0.4.0 darwin-x64 node-v12.18.2
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
* [`joystream-cli content-directory:addClassSchema`](#joystream-cli-content-directoryaddclassschema)
* [`joystream-cli content-directory:addCuratorToGroup [GROUPID] [CURATORID]`](#joystream-cli-content-directoryaddcuratortogroup-groupid-curatorid)
* [`joystream-cli content-directory:addMaintainerToClass [CLASSNAME] [GROUPID]`](#joystream-cli-content-directoryaddmaintainertoclass-classname-groupid)
* [`joystream-cli content-directory:class CLASSNAME`](#joystream-cli-content-directoryclass-classname)
* [`joystream-cli content-directory:classes`](#joystream-cli-content-directoryclasses)
* [`joystream-cli content-directory:createClass`](#joystream-cli-content-directorycreateclass)
* [`joystream-cli content-directory:createCuratorGroup`](#joystream-cli-content-directorycreatecuratorgroup)
* [`joystream-cli content-directory:createEntity CLASSNAME`](#joystream-cli-content-directorycreateentity-classname)
* [`joystream-cli content-directory:curatorGroup ID`](#joystream-cli-content-directorycuratorgroup-id)
* [`joystream-cli content-directory:curatorGroups`](#joystream-cli-content-directorycuratorgroups)
* [`joystream-cli content-directory:entities CLASSNAME [PROPERTIES]`](#joystream-cli-content-directoryentities-classname-properties)
* [`joystream-cli content-directory:entity ID`](#joystream-cli-content-directoryentity-id)
* [`joystream-cli content-directory:initialize`](#joystream-cli-content-directoryinitialize)
* [`joystream-cli content-directory:removeCuratorFromGroup [GROUPID] [CURATORID]`](#joystream-cli-content-directoryremovecuratorfromgroup-groupid-curatorid)
* [`joystream-cli content-directory:removeCuratorGroup [ID]`](#joystream-cli-content-directoryremovecuratorgroup-id)
* [`joystream-cli content-directory:removeEntity ID`](#joystream-cli-content-directoryremoveentity-id)
* [`joystream-cli content-directory:removeMaintainerFromClass [CLASSNAME] [GROUPID]`](#joystream-cli-content-directoryremovemaintainerfromclass-classname-groupid)
* [`joystream-cli content-directory:setCuratorGroupStatus [ID] [STATUS]`](#joystream-cli-content-directorysetcuratorgroupstatus-id-status)
* [`joystream-cli content-directory:updateClassPermissions [CLASSNAME]`](#joystream-cli-content-directoryupdateclasspermissions-classname)
* [`joystream-cli content-directory:updateEntityPropertyValues ID`](#joystream-cli-content-directoryupdateentitypropertyvalues-id)
* [`joystream-cli council:info`](#joystream-cli-councilinfo)
* [`joystream-cli help [COMMAND]`](#joystream-cli-help-command)
* [`joystream-cli media:createChannel`](#joystream-cli-mediacreatechannel)
* [`joystream-cli media:curateContent`](#joystream-cli-mediacuratecontent)
* [`joystream-cli media:featuredVideos`](#joystream-cli-mediafeaturedvideos)
* [`joystream-cli media:myChannels`](#joystream-cli-mediamychannels)
* [`joystream-cli media:myVideos`](#joystream-cli-mediamyvideos)
* [`joystream-cli media:removeChannel [ID]`](#joystream-cli-mediaremovechannel-id)
* [`joystream-cli media:removeVideo [ID]`](#joystream-cli-mediaremovevideo-id)
* [`joystream-cli media:setFeaturedVideos VIDEOIDS`](#joystream-cli-mediasetfeaturedvideos-videoids)
* [`joystream-cli media:updateChannel [ID]`](#joystream-cli-mediaupdatechannel-id)
* [`joystream-cli media:updateVideo [ID]`](#joystream-cli-mediaupdatevideo-id)
* [`joystream-cli media:updateVideoLicense [ID]`](#joystream-cli-mediaupdatevideolicense-id)
* [`joystream-cli media:uploadVideo FILEPATH`](#joystream-cli-mediauploadvideo-filepath)
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
* [`joystream-cli working-groups:setDefaultGroup`](#joystream-cli-working-groupssetdefaultgroup)
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
  -S, --showSpecial      Whether to show special (DEV chain) accounts
  -a, --address=address  Select account by address (if available)
```

_See code: [src/commands/account/choose.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/choose.ts)_

## `joystream-cli account:create NAME`

Create new account

```
USAGE
  $ joystream-cli account:create NAME

ARGUMENTS
  NAME  Account name
```

_See code: [src/commands/account/create.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/create.ts)_

## `joystream-cli account:current`

Display information about currently choosen default account

```
USAGE
  $ joystream-cli account:current

ALIASES
  $ joystream-cli account:info
  $ joystream-cli account:default
```

_See code: [src/commands/account/current.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/current.ts)_

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

_See code: [src/commands/account/export.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/export.ts)_

## `joystream-cli account:forget`

Forget (remove) account from the list of available accounts

```
USAGE
  $ joystream-cli account:forget
```

_See code: [src/commands/account/forget.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/forget.ts)_

## `joystream-cli account:import BACKUPFILEPATH`

Import account using JSON backup file

```
USAGE
  $ joystream-cli account:import BACKUPFILEPATH

ARGUMENTS
  BACKUPFILEPATH  Path to account backup JSON file
```

_See code: [src/commands/account/import.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/import.ts)_

## `joystream-cli account:transferTokens RECIPIENT AMOUNT`

Transfer tokens from currently choosen account

```
USAGE
  $ joystream-cli account:transferTokens RECIPIENT AMOUNT

ARGUMENTS
  RECIPIENT  Address of the transfer recipient
  AMOUNT     Amount of tokens to transfer
```

_See code: [src/commands/account/transferTokens.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/transferTokens.ts)_

## `joystream-cli api:getUri`

Get current api WS provider uri

```
USAGE
  $ joystream-cli api:getUri
```

_See code: [src/commands/api/getUri.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/api/getUri.ts)_

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

_See code: [src/commands/api/inspect.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/api/inspect.ts)_

## `joystream-cli api:setUri [URI]`

Set api WS provider uri

```
USAGE
  $ joystream-cli api:setUri [URI]

ARGUMENTS
  URI  Uri of the node api WS provider (if skipped, a prompt will be displayed)
```

_See code: [src/commands/api/setUri.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/api/setUri.ts)_

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

## `joystream-cli content-directory:addClassSchema`

Add a new schema to a class inside content directory. Requires lead access.

```
USAGE
  $ joystream-cli content-directory:addClassSchema

OPTIONS
  -i, --input=input    Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output  Path to the directory where the output JSON file should be placed (the output file can be then
                       reused as input)
```

_See code: [src/commands/content-directory/addClassSchema.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/addClassSchema.ts)_

## `joystream-cli content-directory:addCuratorToGroup [GROUPID] [CURATORID]`

Add Curator to existing Curator Group.

```
USAGE
  $ joystream-cli content-directory:addCuratorToGroup [GROUPID] [CURATORID]

ARGUMENTS
  GROUPID    ID of the Curator Group
  CURATORID  ID of the curator
```

_See code: [src/commands/content-directory/addCuratorToGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/addCuratorToGroup.ts)_

## `joystream-cli content-directory:addMaintainerToClass [CLASSNAME] [GROUPID]`

Add maintainer (Curator Group) to a class.

```
USAGE
  $ joystream-cli content-directory:addMaintainerToClass [CLASSNAME] [GROUPID]

ARGUMENTS
  CLASSNAME  Name or ID of the class (ie. Video)
  GROUPID    ID of the Curator Group to add as class maintainer
```

_See code: [src/commands/content-directory/addMaintainerToClass.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/addMaintainerToClass.ts)_

## `joystream-cli content-directory:class CLASSNAME`

Show Class details by id or name.

```
USAGE
  $ joystream-cli content-directory:class CLASSNAME

ARGUMENTS
  CLASSNAME  Name or ID of the Class
```

_See code: [src/commands/content-directory/class.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/class.ts)_

## `joystream-cli content-directory:classes`

List existing content directory classes.

```
USAGE
  $ joystream-cli content-directory:classes
```

_See code: [src/commands/content-directory/classes.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/classes.ts)_

## `joystream-cli content-directory:createClass`

Create class inside content directory. Requires lead access.

```
USAGE
  $ joystream-cli content-directory:createClass

OPTIONS
  -i, --input=input    Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output  Path to the directory where the output JSON file should be placed (the output file can be then
                       reused as input)
```

_See code: [src/commands/content-directory/createClass.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/createClass.ts)_

## `joystream-cli content-directory:createCuratorGroup`

Create new Curator Group.

```
USAGE
  $ joystream-cli content-directory:createCuratorGroup

ALIASES
  $ joystream-cli addCuratorGroup
```

_See code: [src/commands/content-directory/createCuratorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/createCuratorGroup.ts)_

## `joystream-cli content-directory:createEntity CLASSNAME`

Creates a new entity in the specified class (can be executed in Member, Curator or Lead context)

```
USAGE
  $ joystream-cli content-directory:createEntity CLASSNAME

ARGUMENTS
  CLASSNAME  Name or ID of the Class

OPTIONS
  --context=(Member|Curator|Lead)  Actor context to execute the command in (Member/Curator/Lead)
```

_See code: [src/commands/content-directory/createEntity.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/createEntity.ts)_

## `joystream-cli content-directory:curatorGroup ID`

Show Curator Group details by ID.

```
USAGE
  $ joystream-cli content-directory:curatorGroup ID

ARGUMENTS
  ID  ID of the Curator Group
```

_See code: [src/commands/content-directory/curatorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/curatorGroup.ts)_

## `joystream-cli content-directory:curatorGroups`

List existing Curator Groups.

```
USAGE
  $ joystream-cli content-directory:curatorGroups
```

_See code: [src/commands/content-directory/curatorGroups.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/curatorGroups.ts)_

## `joystream-cli content-directory:entities CLASSNAME [PROPERTIES]`

Show entities list by class id or name.

```
USAGE
  $ joystream-cli content-directory:entities CLASSNAME [PROPERTIES]

ARGUMENTS
  CLASSNAME   Name or ID of the Class

  PROPERTIES  Comma-separated properties to include in the results table (ie. code,name). By default all property values
              will be included.

OPTIONS
  --filters=filters  Comma-separated filters, ie. title="Some video",channelId=3.Currently only the = operator is
                     supported.When multiple filters are provided, only the entities that match all of them together
                     will be displayed.
```

_See code: [src/commands/content-directory/entities.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/entities.ts)_

## `joystream-cli content-directory:entity ID`

Show Entity details by id.

```
USAGE
  $ joystream-cli content-directory:entity ID

ARGUMENTS
  ID  ID of the Entity
```

_See code: [src/commands/content-directory/entity.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/entity.ts)_

## `joystream-cli content-directory:initialize`

Initialize content directory with input data from @joystream/content library or custom, provided one. Requires lead access.

```
USAGE
  $ joystream-cli content-directory:initialize

OPTIONS
  --rootInputsDir=rootInputsDir  Custom inputs directory (must follow @joystream/content directory structure)
```

_See code: [src/commands/content-directory/initialize.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/initialize.ts)_

## `joystream-cli content-directory:removeCuratorFromGroup [GROUPID] [CURATORID]`

Remove Curator from Curator Group.

```
USAGE
  $ joystream-cli content-directory:removeCuratorFromGroup [GROUPID] [CURATORID]

ARGUMENTS
  GROUPID    ID of the Curator Group
  CURATORID  ID of the curator
```

_See code: [src/commands/content-directory/removeCuratorFromGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/removeCuratorFromGroup.ts)_

## `joystream-cli content-directory:removeCuratorGroup [ID]`

Remove existing Curator Group.

```
USAGE
  $ joystream-cli content-directory:removeCuratorGroup [ID]

ARGUMENTS
  ID  ID of the Curator Group to remove
```

_See code: [src/commands/content-directory/removeCuratorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/removeCuratorGroup.ts)_

## `joystream-cli content-directory:removeEntity ID`

Removes a single entity by id (can be executed in Member, Curator or Lead context)

```
USAGE
  $ joystream-cli content-directory:removeEntity ID

ARGUMENTS
  ID  ID of the entity to remove

OPTIONS
  --context=(Member|Curator|Lead)  Actor context to execute the command in (Member/Curator/Lead)
```

_See code: [src/commands/content-directory/removeEntity.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/removeEntity.ts)_

## `joystream-cli content-directory:removeMaintainerFromClass [CLASSNAME] [GROUPID]`

Remove maintainer (Curator Group) from class.

```
USAGE
  $ joystream-cli content-directory:removeMaintainerFromClass [CLASSNAME] [GROUPID]

ARGUMENTS
  CLASSNAME  Name or ID of the class (ie. Video)
  GROUPID    ID of the Curator Group to remove from maintainers
```

_See code: [src/commands/content-directory/removeMaintainerFromClass.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/removeMaintainerFromClass.ts)_

## `joystream-cli content-directory:setCuratorGroupStatus [ID] [STATUS]`

Set Curator Group status (Active/Inactive).

```
USAGE
  $ joystream-cli content-directory:setCuratorGroupStatus [ID] [STATUS]

ARGUMENTS
  ID      ID of the Curator Group
  STATUS  New status of the group (1 - active, 0 - inactive)
```

_See code: [src/commands/content-directory/setCuratorGroupStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/setCuratorGroupStatus.ts)_

## `joystream-cli content-directory:updateClassPermissions [CLASSNAME]`

Update permissions in given class.

```
USAGE
  $ joystream-cli content-directory:updateClassPermissions [CLASSNAME]

ARGUMENTS
  CLASSNAME  Name or ID of the class (ie. Video)
```

_See code: [src/commands/content-directory/updateClassPermissions.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/updateClassPermissions.ts)_

## `joystream-cli content-directory:updateEntityPropertyValues ID`

Updates the property values of the specified entity (can be executed in Member, Curator or Lead context)

```
USAGE
  $ joystream-cli content-directory:updateEntityPropertyValues ID

ARGUMENTS
  ID  ID of the Entity

OPTIONS
  --context=(Member|Curator|Lead)  Actor context to execute the command in (Member/Curator/Lead)
```

_See code: [src/commands/content-directory/updateEntityPropertyValues.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content-directory/updateEntityPropertyValues.ts)_

## `joystream-cli council:info`

Get current council and council elections information

```
USAGE
  $ joystream-cli council:info
```

_See code: [src/commands/council/info.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/council/info.ts)_

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

## `joystream-cli media:createChannel`

Create a new channel on Joystream (requires a membership).

```
USAGE
  $ joystream-cli media:createChannel

OPTIONS
  -i, --input=input    Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output  Path to the directory where the output JSON file should be placed (the output file can be then
                       reused as input)

  -y, --confirm        Confirm the provided input
```

_See code: [src/commands/media/createChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/createChannel.ts)_

## `joystream-cli media:curateContent`

Set the curation status of given entity (Channel/Video). Requires Curator access.

```
USAGE
  $ joystream-cli media:curateContent

OPTIONS
  -c, --className=(Channel|Video)   (required) Name of the class of the entity to curate (Channel/Video)
  -s, --status=(Accepted|Censored)  (required) Specifies the curation status (Accepted/Censored)
  --id=id                           (required) ID of the entity to curate
```

_See code: [src/commands/media/curateContent.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/curateContent.ts)_

## `joystream-cli media:featuredVideos`

Show a list of currently featured videos.

```
USAGE
  $ joystream-cli media:featuredVideos
```

_See code: [src/commands/media/featuredVideos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/featuredVideos.ts)_

## `joystream-cli media:myChannels`

Show the list of channels associated with current account's membership.

```
USAGE
  $ joystream-cli media:myChannels
```

_See code: [src/commands/media/myChannels.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/myChannels.ts)_

## `joystream-cli media:myVideos`

Show the list of videos associated with current account's membership.

```
USAGE
  $ joystream-cli media:myVideos

OPTIONS
  -c, --channel=channel  Channel id to filter the videos by
```

_See code: [src/commands/media/myVideos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/myVideos.ts)_

## `joystream-cli media:removeChannel [ID]`

Removes a channel (required controller access).

```
USAGE
  $ joystream-cli media:removeChannel [ID]

ARGUMENTS
  ID  ID of the Channel entity
```

_See code: [src/commands/media/removeChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/removeChannel.ts)_

## `joystream-cli media:removeVideo [ID]`

Remove given Video entity and associated entities (VideoMedia, License) from content directory.

```
USAGE
  $ joystream-cli media:removeVideo [ID]

ARGUMENTS
  ID  ID of the Video entity
```

_See code: [src/commands/media/removeVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/removeVideo.ts)_

## `joystream-cli media:setFeaturedVideos VIDEOIDS`

Set currently featured videos (requires lead/maintainer access).

```
USAGE
  $ joystream-cli media:setFeaturedVideos VIDEOIDS

ARGUMENTS
  VIDEOIDS  Comma-separated video ids

OPTIONS
  --add  If provided - currently featured videos will not be removed.
```

_See code: [src/commands/media/setFeaturedVideos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/setFeaturedVideos.ts)_

## `joystream-cli media:updateChannel [ID]`

Update one of the owned channels on Joystream (requires a membership).

```
USAGE
  $ joystream-cli media:updateChannel [ID]

ARGUMENTS
  ID  ID of the channel to update

OPTIONS
  -i, --input=input    Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output  Path to the directory where the output JSON file should be placed (the output file can be then
                       reused as input)

  --asCurator          Provide this flag in order to use Curator context for the update
```

_See code: [src/commands/media/updateChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/updateChannel.ts)_

## `joystream-cli media:updateVideo [ID]`

Update existing video information (requires controller/maintainer access).

```
USAGE
  $ joystream-cli media:updateVideo [ID]

ARGUMENTS
  ID  ID of the Video to update

OPTIONS
  --asCurator  Specify in order to update the video as curator
```

_See code: [src/commands/media/updateVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/updateVideo.ts)_

## `joystream-cli media:updateVideoLicense [ID]`

Update existing video license (requires controller/maintainer access).

```
USAGE
  $ joystream-cli media:updateVideoLicense [ID]

ARGUMENTS
  ID  ID of the Video
```

_See code: [src/commands/media/updateVideoLicense.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/updateVideoLicense.ts)_

## `joystream-cli media:uploadVideo FILEPATH`

Upload a new Video to a channel (requires a membership).

```
USAGE
  $ joystream-cli media:uploadVideo FILEPATH

ARGUMENTS
  FILEPATH  Path to the media file to upload

OPTIONS
  -c, --channel=channel  ID of the channel to assign the video to (if omitted - one of the owned channels can be
                         selected from the list)

  -i, --input=input      Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -y, --confirm          Confirm the provided input
```

_See code: [src/commands/media/uploadVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/media/uploadVideo.ts)_

## `joystream-cli working-groups:application WGAPPLICATIONID`

Shows an overview of given application by Working Group Application ID

```
USAGE
  $ joystream-cli working-groups:application WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/application.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/application.ts)_

## `joystream-cli working-groups:createOpening`

Create working group opening (requires lead access)

```
USAGE
  $ joystream-cli working-groups:createOpening

OPTIONS
  -e, --edit                               If provided along with --input - launches in edit mode allowing to modify the
                                           input before sending the exstinsic

  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.

  -i, --input=input                        Path to JSON file to use as input (if not specified - the input can be
                                           provided interactively)

  -o, --output=output                      Path to the file where the output JSON should be saved (this output can be
                                           then reused as input)

  --dryRun                                 If provided along with --output - skips sending the actual extrinsic(can be
                                           used to generate a "draft" which can be provided as input later)
```

_See code: [src/commands/working-groups/createOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/createOpening.ts)_

## `joystream-cli working-groups:decreaseWorkerStake WORKERID`

Decreases given worker stake by an amount that will be returned to the worker role account. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:decreaseWorkerStake WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/decreaseWorkerStake.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/decreaseWorkerStake.ts)_

## `joystream-cli working-groups:evictWorker WORKERID`

Evicts given worker. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:evictWorker WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/evictWorker.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/evictWorker.ts)_

## `joystream-cli working-groups:fillOpening WGOPENINGID`

Allows filling working group opening that's currently in review. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:fillOpening WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/fillOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/fillOpening.ts)_

## `joystream-cli working-groups:increaseStake`

Increases current role (lead/worker) stake. Requires active role account to be selected.

```
USAGE
  $ joystream-cli working-groups:increaseStake

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/increaseStake.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/increaseStake.ts)_

## `joystream-cli working-groups:leaveRole`

Leave the worker or lead role associated with currently selected account.

```
USAGE
  $ joystream-cli working-groups:leaveRole

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/leaveRole.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/leaveRole.ts)_

## `joystream-cli working-groups:opening WGOPENINGID`

Shows an overview of given working group opening by Working Group Opening ID

```
USAGE
  $ joystream-cli working-groups:opening WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/opening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/opening.ts)_

## `joystream-cli working-groups:openings`

Shows an overview of given working group openings

```
USAGE
  $ joystream-cli working-groups:openings

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/openings.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/openings.ts)_

## `joystream-cli working-groups:overview`

Shows an overview of given working group (current lead and workers)

```
USAGE
  $ joystream-cli working-groups:overview

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/overview.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/overview.ts)_

## `joystream-cli working-groups:setDefaultGroup`

Change the default group context for working-groups commands.

```
USAGE
  $ joystream-cli working-groups:setDefaultGroup

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/setDefaultGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/setDefaultGroup.ts)_

## `joystream-cli working-groups:slashWorker WORKERID`

Slashes given worker stake. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:slashWorker WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/slashWorker.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/slashWorker.ts)_

## `joystream-cli working-groups:startAcceptingApplications WGOPENINGID`

Changes the status of pending opening to "Accepting applications". Requires lead access.

```
USAGE
  $ joystream-cli working-groups:startAcceptingApplications WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/startAcceptingApplications.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/startAcceptingApplications.ts)_

## `joystream-cli working-groups:startReviewPeriod WGOPENINGID`

Changes the status of active opening to "In review". Requires lead access.

```
USAGE
  $ joystream-cli working-groups:startReviewPeriod WGOPENINGID

ARGUMENTS
  WGOPENINGID  Working Group Opening ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/startReviewPeriod.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/startReviewPeriod.ts)_

## `joystream-cli working-groups:terminateApplication WGAPPLICATIONID`

Terminates given working group application. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:terminateApplication WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/terminateApplication.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/terminateApplication.ts)_

## `joystream-cli working-groups:updateRewardAccount [ACCOUNTADDRESS]`

Updates the worker/lead reward account (requires current role account to be selected)

```
USAGE
  $ joystream-cli working-groups:updateRewardAccount [ACCOUNTADDRESS]

ARGUMENTS
  ACCOUNTADDRESS  New reward account address (if omitted, one of the existing CLI accounts can be selected)

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/updateRewardAccount.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRewardAccount.ts)_

## `joystream-cli working-groups:updateRoleAccount [ACCOUNTADDRESS]`

Updates the worker/lead role account. Requires member controller account to be selected

```
USAGE
  $ joystream-cli working-groups:updateRoleAccount [ACCOUNTADDRESS]

ARGUMENTS
  ACCOUNTADDRESS  New role account address (if omitted, one of the existing CLI accounts can be selected)

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/updateRoleAccount.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRoleAccount.ts)_

## `joystream-cli working-groups:updateWorkerReward WORKERID`

Change given worker's reward (amount only). Requires lead access.

```
USAGE
  $ joystream-cli working-groups:updateWorkerReward WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=(storageProviders|curators)  The working group context in which the command should be executed
                                           Available values are: storageProviders, curators.
```

_See code: [src/commands/working-groups/updateWorkerReward.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateWorkerReward.ts)_
<!-- commandsstop -->
