# @joystream/cli

Command Line Interface for Joystream community and governance activities

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![License](https://img.shields.io/npm/l/@joystream/cli.svg)](https://github.com/Joystream/joystream/blob/master/cli/package.json)

<!-- toc -->

- [@joystream/cli](#joystreamcli)
- [Usage](#usage)
- [Development](#development)
- [First steps](#first-steps)
- [Useful environment settings](#useful-environment-settings)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @joystream/cli
$ joystream-cli COMMAND
running command...
$ joystream-cli (-v|--version|version)
@joystream/cli/0.8.0 darwin-x64 node-v14.16.1
$ joystream-cli --help [COMMAND]
USAGE
  $ joystream-cli COMMAND
...
```

<!-- usagestop -->

# Development

<!-- development -->

To run a command in developemnt environment (from the root of [Joystream monorepo](https://github.com/Joystream/joystream), without installing the package):

```shell
  $ yarn && yarn workspace @joystream/types build && yarn workspace @joystream/metadata-protobuf build
  $ ./cli/bin/run COMMAND # OR:
  $ yarn joystream-cli COMMAND
```

Alternatively:

```shell
  $ yarn workspace @joystream/cli link
  $ joystream-cli COMMAND
```

<!-- developmentstop -->

# First steps

<!-- first-steps -->

When using the CLI for the first time there are a few common steps you might want to take in order to configure the CLI:

1. Set the correct Joystream node websocket endpoint. You can do this by executing [`api:setUri`](#joystream-cli-apiseturi-uri) and choosing one of the suggested endpoints of providing your own url. To verify the currently used Joystream node websocket endpoint you can execute [`api:getUri`](#joystream-cli-apigeturi).
2. Set the Joystream query node endpoint. This is optional, but some commands (for example: [`content:createChannel`](#joystream-cli-contentcreatechannel)) will require a connection to the query node in order to fetch the data they need complete the requested operations (ie. [`content:createChannel`](#joystream-cli-contentcreatechannel) will need to fetch the available storage node endnpoints in order to upload the channel assets). In order to do that, execute [`api:setQueryNodeEndpoint`](#joystream-cli-apisetquerynodeendpoint-endpoint) and choose one of the suggested endpoints or provide your own url. You can use [`api:getQueryNodeEndpoint`](#joystream-cli-apigetquerynodeendpoint) any time to verify the currently set endpoint.
3. In order to use your existing keys within the CLI, you can import them using [`account:import`](#joystream-cli-accountimport) command. You can provide json backup files exported from Pioneer or Polkadot{.js} extension as an input. You can also use raw mnemonic or seed phrases. See the [`account:import` command documentation](#joystream-cli-accountimport) for the full list of supported inputs.
   The key to sign the transaction(s) with will be determined based on the required permissions, depending on the command you execute. For example, if you execute [`working-groups:updateRewardAccount --group storageProviders`](#joystream-cli-working-groupsupdaterewardaccount-address), the CLI will look for a storage provider role key among your available keys. If multiple execution contexts are available, the CLI will prompt you to choose the desired one.
4. **Optionally:** You may also find it useful to get the first part of the command (before the colon) autocompleted when you press `[Tab]` while typing the command name in the console. Executing [`autocomplete`](#joystream-cli-autocomplete-shell) command will provide you the instructions on how to set this up.
5. That's it! The CLI is now be fully set up! Feel free to use the `--help` flag to investigate the available commands or take a look at the commands documentation below.
<!-- first-steps -->

# Useful environment settings

<!-- env -->

- `FORCE_COLOR=0` - disables output coloring. This will make the output easier to parse in case it's redirected to a file or used within a script.
- `AUTO_CONFIRM=true` - this will make the CLI skip asking for any confirmations (can be useful when creating bash scripts).
<!-- envstop -->

# Commands

<!-- commands -->

- [`joystream-cli account:create`](#joystream-cli-accountcreate)
- [`joystream-cli account:export DESTPATH`](#joystream-cli-accountexport-destpath)
- [`joystream-cli account:forget`](#joystream-cli-accountforget)
- [`joystream-cli account:import`](#joystream-cli-accountimport)
- [`joystream-cli account:info [ADDRESS]`](#joystream-cli-accountinfo-address)
- [`joystream-cli account:list`](#joystream-cli-accountlist)
- [`joystream-cli account:transferTokens`](#joystream-cli-accounttransfertokens)
- [`joystream-cli api:getQueryNodeEndpoint`](#joystream-cli-apigetquerynodeendpoint)
- [`joystream-cli api:getUri`](#joystream-cli-apigeturi)
- [`joystream-cli api:inspect`](#joystream-cli-apiinspect)
- [`joystream-cli api:setQueryNodeEndpoint [ENDPOINT]`](#joystream-cli-apisetquerynodeendpoint-endpoint)
- [`joystream-cli api:setUri [URI]`](#joystream-cli-apiseturi-uri)
- [`joystream-cli autocomplete [SHELL]`](#joystream-cli-autocomplete-shell)
- [`joystream-cli content:addCuratorToGroup [GROUPID] [CURATORID]`](#joystream-cli-contentaddcuratortogroup-groupid-curatorid)
- [`joystream-cli content:channel CHANNELID`](#joystream-cli-contentchannel-channelid)
- [`joystream-cli content:channels`](#joystream-cli-contentchannels)
- [`joystream-cli content:createChannel`](#joystream-cli-contentcreatechannel)
- [`joystream-cli content:createCuratorGroup`](#joystream-cli-contentcreatecuratorgroup)
- [`joystream-cli content:createVideo`](#joystream-cli-contentcreatevideo)
- [`joystream-cli content:createVideoCategory`](#joystream-cli-contentcreatevideocategory)
- [`joystream-cli content:curatorGroup ID`](#joystream-cli-contentcuratorgroup-id)
- [`joystream-cli content:curatorGroups`](#joystream-cli-contentcuratorgroups)
- [`joystream-cli content:deleteChannel`](#joystream-cli-contentdeletechannel)
- [`joystream-cli content:deleteChannelAsModerator`](#joystream-cli-contentdeletechannelasmoderator)
- [`joystream-cli content:deleteChannelAssetsAsModerator`](#joystream-cli-contentdeletechannelassetsasmoderator)
- [`joystream-cli content:deleteVideo`](#joystream-cli-contentdeletevideo)
- [`joystream-cli content:deleteVideoAsModerator`](#joystream-cli-contentdeletevideoasmoderator)
- [`joystream-cli content:deleteVideoAssetsAsModerator`](#joystream-cli-contentdeletevideoassetsasmoderator)
- [`joystream-cli content:deleteVideoCategory VIDEOCATEGORYID`](#joystream-cli-contentdeletevideocategory-videocategoryid)
- [`joystream-cli content:removeChannelAssets`](#joystream-cli-contentremovechannelassets)
- [`joystream-cli content:removeCuratorFromGroup [GROUPID] [CURATORID]`](#joystream-cli-contentremovecuratorfromgroup-groupid-curatorid)
- [`joystream-cli content:reuploadAssets`](#joystream-cli-contentreuploadassets)
- [`joystream-cli content:setCuratorGroupStatus [ID] [STATUS]`](#joystream-cli-contentsetcuratorgroupstatus-id-status)
- [`joystream-cli content:updateChannel CHANNELID`](#joystream-cli-contentupdatechannel-channelid)
- [`joystream-cli content:updateChannelStateBloatBond VALUE`](#joystream-cli-contentupdatechannelstatebloatbond-value)
- [`joystream-cli content:updateCuratorGroupPermissions [ID]`](#joystream-cli-contentupdatecuratorgrouppermissions-id)
- [`joystream-cli content:updateVideo VIDEOID`](#joystream-cli-contentupdatevideo-videoid)
- [`joystream-cli content:updateVideoCategory VIDEOCATEGORYID`](#joystream-cli-contentupdatevideocategory-videocategoryid)
- [`joystream-cli content:updateVideoStateBloatBond VALUE`](#joystream-cli-contentupdatevideostatebloatbond-value)
- [`joystream-cli content:video VIDEOID`](#joystream-cli-contentvideo-videoid)
- [`joystream-cli content:videos [CHANNELID]`](#joystream-cli-contentvideos-channelid)
- [`joystream-cli forum:addPost`](#joystream-cli-forumaddpost)
- [`joystream-cli forum:categories`](#joystream-cli-forumcategories)
- [`joystream-cli forum:category`](#joystream-cli-forumcategory)
- [`joystream-cli forum:createCategory`](#joystream-cli-forumcreatecategory)
- [`joystream-cli forum:createThread`](#joystream-cli-forumcreatethread)
- [`joystream-cli forum:deleteCategory`](#joystream-cli-forumdeletecategory)
- [`joystream-cli forum:moderatePost`](#joystream-cli-forummoderatepost)
- [`joystream-cli forum:moderateThread`](#joystream-cli-forummoderatethread)
- [`joystream-cli forum:moveThread`](#joystream-cli-forummovethread)
- [`joystream-cli forum:posts`](#joystream-cli-forumposts)
- [`joystream-cli forum:setStickiedThreads`](#joystream-cli-forumsetstickiedthreads)
- [`joystream-cli forum:threads`](#joystream-cli-forumthreads)
- [`joystream-cli forum:updateCategoryArchivalStatus`](#joystream-cli-forumupdatecategoryarchivalstatus)
- [`joystream-cli forum:updateCategoryModeratorStatus`](#joystream-cli-forumupdatecategorymoderatorstatus)
- [`joystream-cli help [COMMAND]`](#joystream-cli-help-command)
- [`joystream-cli membership:addStakingAccount`](#joystream-cli-membershipaddstakingaccount)
- [`joystream-cli membership:buy`](#joystream-cli-membershipbuy)
- [`joystream-cli membership:details`](#joystream-cli-membershipdetails)
- [`joystream-cli membership:update`](#joystream-cli-membershipupdate)
- [`joystream-cli membership:updateAccounts`](#joystream-cli-membershipupdateaccounts)
- [`joystream-cli staking:validate`](#joystream-cli-stakingvalidate)
- [`joystream-cli working-groups:application WGAPPLICATIONID`](#joystream-cli-working-groupsapplication-wgapplicationid)
- [`joystream-cli working-groups:apply`](#joystream-cli-working-groupsapply)
- [`joystream-cli working-groups:cancelOpening OPENINGID`](#joystream-cli-working-groupscancelopening-openingid)
- [`joystream-cli working-groups:createOpening`](#joystream-cli-working-groupscreateopening)
- [`joystream-cli working-groups:decreaseWorkerStake WORKERID AMOUNT`](#joystream-cli-working-groupsdecreaseworkerstake-workerid-amount)
- [`joystream-cli working-groups:evictWorker WORKERID`](#joystream-cli-working-groupsevictworker-workerid)
- [`joystream-cli working-groups:fillOpening`](#joystream-cli-working-groupsfillopening)
- [`joystream-cli working-groups:increaseStake AMOUNT`](#joystream-cli-working-groupsincreasestake-amount)
- [`joystream-cli working-groups:leaveRole`](#joystream-cli-working-groupsleaverole)
- [`joystream-cli working-groups:opening`](#joystream-cli-working-groupsopening)
- [`joystream-cli working-groups:openings`](#joystream-cli-working-groupsopenings)
- [`joystream-cli working-groups:overview`](#joystream-cli-working-groupsoverview)
- [`joystream-cli working-groups:removeUpcomingOpening`](#joystream-cli-working-groupsremoveupcomingopening)
- [`joystream-cli working-groups:setDefaultGroup`](#joystream-cli-working-groupssetdefaultgroup)
- [`joystream-cli working-groups:slashWorker WORKERID AMOUNT`](#joystream-cli-working-groupsslashworker-workerid-amount)
- [`joystream-cli working-groups:updateGroupMetadata`](#joystream-cli-working-groupsupdategroupmetadata)
- [`joystream-cli working-groups:updateRewardAccount [ADDRESS]`](#joystream-cli-working-groupsupdaterewardaccount-address)
- [`joystream-cli working-groups:updateRoleAccount [ADDRESS]`](#joystream-cli-working-groupsupdateroleaccount-address)
- [`joystream-cli working-groups:updateRoleStorage STORAGE`](#joystream-cli-working-groupsupdaterolestorage-storage)
- [`joystream-cli working-groups:updateWorkerReward WORKERID NEWREWARD`](#joystream-cli-working-groupsupdateworkerreward-workerid-newreward)

## `joystream-cli account:create`

Create a new account

```
USAGE
  $ joystream-cli account:create

OPTIONS
  --name=name               Account name
  --type=(sr25519|ed25519)  Account type (defaults to sr25519)
```

_See code: [src/commands/account/create.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/create.ts)_

## `joystream-cli account:export DESTPATH`

Export account(s) to given location

```
USAGE
  $ joystream-cli account:export DESTPATH

ARGUMENTS
  DESTPATH  Path where the exported files should be placed

OPTIONS
  -a, --all        If provided, exports all existing accounts into "exported_accounts" folder inside given path
  -n, --name=name  Name of the account to export
```

_See code: [src/commands/account/export.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/export.ts)_

## `joystream-cli account:forget`

Forget (remove) account from the list of available accounts

```
USAGE
  $ joystream-cli account:forget

OPTIONS
  --address=address  Address of the account to remove
  --name=name        Name of the account to remove
```

_See code: [src/commands/account/forget.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/forget.ts)_

## `joystream-cli account:import`

Import account using mnemonic phrase, seed, suri or json backup file

```
USAGE
  $ joystream-cli account:import

OPTIONS
  --backupFilePath=backupFilePath  Path to account backup JSON file
  --mnemonic=mnemonic              Mnemonic phrase
  --name=name                      Account name
  --password=password              Account password
  --seed=seed                      Secret seed
  --suri=suri                      Substrate uri
  --type=(sr25519|ed25519)         Account type (defaults to sr25519)
```

_See code: [src/commands/account/import.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/import.ts)_

## `joystream-cli account:info [ADDRESS]`

Display detailed information about specified account

```
USAGE
  $ joystream-cli account:info [ADDRESS]

ARGUMENTS
  ADDRESS  An address to inspect (can also be provided interavtively)

ALIASES
  $ joystream-cli account:inspect
```

_See code: [src/commands/account/info.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/info.ts)_

## `joystream-cli account:list`

List all available accounts

```
USAGE
  $ joystream-cli account:list
```

_See code: [src/commands/account/list.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/list.ts)_

## `joystream-cli account:transferTokens`

Transfer tokens from any of the available accounts

```
USAGE
  $ joystream-cli account:transferTokens

OPTIONS
  --amount=amount  (required) Amount of tokens to transfer
  --from=from      Address of the sender (can also be provided interactively)
  --to=to          Address of the recipient (can also be provided interactively)
```

_See code: [src/commands/account/transferTokens.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/account/transferTokens.ts)_

## `joystream-cli api:getQueryNodeEndpoint`

Get current query node endpoint

```
USAGE
  $ joystream-cli api:getQueryNodeEndpoint
```

_See code: [src/commands/api/getQueryNodeEndpoint.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/api/getQueryNodeEndpoint.ts)_

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

## `joystream-cli api:setQueryNodeEndpoint [ENDPOINT]`

Set query node endpoint

```
USAGE
  $ joystream-cli api:setQueryNodeEndpoint [ENDPOINT]

ARGUMENTS
  ENDPOINT  Query node endpoint for the CLI to use
```

_See code: [src/commands/api/setQueryNodeEndpoint.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/api/setQueryNodeEndpoint.ts)_

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

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.2.1/src/commands/autocomplete/index.ts)_

## `joystream-cli content:addCuratorToGroup [GROUPID] [CURATORID]`

Add Curator to existing Curator Group.

```
USAGE
  $ joystream-cli content:addCuratorToGroup [GROUPID] [CURATORID]

ARGUMENTS
  GROUPID    ID of the Curator Group
  CURATORID  ID of the curator

OPTIONS
  -p, --permissions=UpdateChannelMetadata|ManageNonVideoChannelAssets|ManageChannelCollaborators|UpdateVideoMetadata|Add
  Video|ManageVideoAssets|DeleteChannel|DeleteVideo|ManageVideoNfts|AgentRemark|TransferChannel|ClaimChannelReward|Withd
  rawFromChannelBalance|IssueCreatorToken|ClaimCreatorTokenPatronage|InitAndManageCreatorTokenSale|CreatorTokenIssuerTra
  nsfer|MakeCreatorTokenPermissionless|ReduceCreatorTokenPatronageRate|ManageRevenueSplits|DeissueCreatorToken
      List of permissions to associate with the curator, e.g. -p ManageChannelCollaborators UpdateVideoMetadata

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/addCuratorToGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/addCuratorToGroup.ts)_

## `joystream-cli content:channel CHANNELID`

Show Channel details by id.

```
USAGE
  $ joystream-cli content:channel CHANNELID

ARGUMENTS
  CHANNELID  Name or ID of the Channel

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/channel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/channel.ts)_

## `joystream-cli content:channels`

List existing content directory channels.

```
USAGE
  $ joystream-cli content:channels

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/channels.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/channels.ts)_

## `joystream-cli content:createChannel`

Create channel inside content directory.

```
USAGE
  $ joystream-cli content:createChannel

OPTIONS
  -i, --input=input                (required) Path to JSON file to use as input
  --context=(Member|CuratorGroup)  Actor context to execute the command in (Member/CuratorGroup)
  --useMemberId=useMemberId        Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId        Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/createChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createChannel.ts)_

## `joystream-cli content:createCuratorGroup`

Create new Curator Group.

```
USAGE
  $ joystream-cli content:createCuratorGroup

OPTIONS
  -p, --permissions=permissions  Path to JSON file containing moderation permissions by channel privilege level to use
                                 as input

  --status=(ACTIVE|INACTIVE)     (required) Status of newly created Curator Group: (ACTIVE/INACTIVE)

  --useMemberId=useMemberId      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/createCuratorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createCuratorGroup.ts)_

## `joystream-cli content:createVideo`

Create video under specific channel inside content directory.

```
USAGE
  $ joystream-cli content:createVideo

OPTIONS
  -c, --channelId=channelId       (required) ID of the Channel
  -i, --input=input               (required) Path to JSON file to use as input
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
  --useMemberId=useMemberId       Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId       Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/createVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createVideo.ts)_

## `joystream-cli content:createVideoCategory`

Create video category inside content directory.

```
USAGE
  $ joystream-cli content:createVideoCategory

OPTIONS
  -i, --input=input          (required) Path to JSON file to use as input
  --context=(Lead|Curator)   Actor context to execute the command in (Lead/Curator)
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/createVideoCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createVideoCategory.ts)_

## `joystream-cli content:curatorGroup ID`

Show Curator Group details by ID.

```
USAGE
  $ joystream-cli content:curatorGroup ID

ARGUMENTS
  ID  ID of the Curator Group

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/curatorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/curatorGroup.ts)_

## `joystream-cli content:curatorGroups`

List existing Curator Groups.

```
USAGE
  $ joystream-cli content:curatorGroups

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/curatorGroups.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/curatorGroups.ts)_

## `joystream-cli content:deleteChannel`

Delete the channel and optionally all associated data objects.

```
USAGE
  $ joystream-cli content:deleteChannel

OPTIONS
  -c, --channelId=channelId  (required) ID of the Channel
  -f, --force                Force-remove all associated channel data objects
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteChannel.ts)_

## `joystream-cli content:deleteChannelAsModerator`

Delete the channel and optionally all associated data objects.

```
USAGE
  $ joystream-cli content:deleteChannelAsModerator

OPTIONS
  -c, --channelId=channelId  (required) ID of the Channel
  -f, --force                Force-remove all associated channel data objects
  -r, --rationale=rationale  (required) Reason of deleting the channel by moderator
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteChannelAsModerator.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteChannelAsModerator.ts)_

## `joystream-cli content:deleteChannelAssetsAsModerator`

Delete the channel assets.

```
USAGE
  $ joystream-cli content:deleteChannelAssetsAsModerator

OPTIONS
  -a, --assetIds=assetIds    (required) List of data object IDs to delete
  -c, --channelId=channelId  (required) ID of the Channel
  -r, --rationale=rationale  (required) Reason for removing the channel assets by moderator
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteChannelAssetsAsModerator.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteChannelAssetsAsModerator.ts)_

## `joystream-cli content:deleteVideo`

Delete the video and optionally all associated data objects.

```
USAGE
  $ joystream-cli content:deleteVideo

OPTIONS
  -f, --force                     Force-remove all associated video data objects
  -v, --videoId=videoId           (required) ID of the Video
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
  --useMemberId=useMemberId       Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId       Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteVideo.ts)_

## `joystream-cli content:deleteVideoAsModerator`

Delete the video and optionally all associated data objects.

```
USAGE
  $ joystream-cli content:deleteVideoAsModerator

OPTIONS
  -f, --force                Force-remove all associated video data objects
  -r, --rationale=rationale  (required) reason of deleting the video by moderator
  -v, --videoId=videoId      (required) ID of the Video
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteVideoAsModerator.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteVideoAsModerator.ts)_

## `joystream-cli content:deleteVideoAssetsAsModerator`

Delete the video assets.

```
USAGE
  $ joystream-cli content:deleteVideoAssetsAsModerator

OPTIONS
  -a, --assetIds=assetIds    (required) List of data object IDs to delete
  -r, --rationale=rationale  (required) Reason for removing the video assets by moderator
  -v, --videoId=videoId      (required) ID of the Video
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteVideoAssetsAsModerator.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteVideoAssetsAsModerator.ts)_

## `joystream-cli content:deleteVideoCategory VIDEOCATEGORYID`

Delete video category.

```
USAGE
  $ joystream-cli content:deleteVideoCategory VIDEOCATEGORYID

ARGUMENTS
  VIDEOCATEGORYID  ID of the Video Category

OPTIONS
  --context=(Lead|Curator)   Actor context to execute the command in (Lead/Curator)
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/deleteVideoCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteVideoCategory.ts)_

## `joystream-cli content:removeChannelAssets`

Remove data objects associated with the channel or any of its videos.

```
USAGE
  $ joystream-cli content:removeChannelAssets

OPTIONS
  -c, --channelId=channelId       (required) ID of the Channel
  -o, --objectId=objectId         (required) ID of an object to remove
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
  --useMemberId=useMemberId       Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId       Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/removeChannelAssets.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/removeChannelAssets.ts)_

## `joystream-cli content:removeCuratorFromGroup [GROUPID] [CURATORID]`

Remove Curator from Curator Group.

```
USAGE
  $ joystream-cli content:removeCuratorFromGroup [GROUPID] [CURATORID]

ARGUMENTS
  GROUPID    ID of the Curator Group
  CURATORID  ID of the curator

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/removeCuratorFromGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/removeCuratorFromGroup.ts)_

## `joystream-cli content:reuploadAssets`

Allows reuploading assets that were not successfully uploaded during channel/video creation

```
USAGE
  $ joystream-cli content:reuploadAssets

OPTIONS
  -i, --input=input          (required) Path to JSON file containing array of assets to reupload (contentIds and paths)
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/reuploadAssets.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/reuploadAssets.ts)_

## `joystream-cli content:setCuratorGroupStatus [ID] [STATUS]`

Set Curator Group status (Active/Inactive).

```
USAGE
  $ joystream-cli content:setCuratorGroupStatus [ID] [STATUS]

ARGUMENTS
  ID      ID of the Curator Group
  STATUS  New status of the group (1 - active, 0 - inactive)

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/setCuratorGroupStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/setCuratorGroupStatus.ts)_

## `joystream-cli content:updateChannel CHANNELID`

Update existing content directory channel.

```
USAGE
  $ joystream-cli content:updateChannel CHANNELID

ARGUMENTS
  CHANNELID  ID of the Channel

OPTIONS
  -i, --input=input               (required) Path to JSON file to use as input
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
  --useMemberId=useMemberId       Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId       Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateChannel.ts)_

## `joystream-cli content:updateChannelStateBloatBond VALUE`

Update channel state bloat bond.

```
USAGE
  $ joystream-cli content:updateChannelStateBloatBond VALUE

ARGUMENTS
  VALUE  New state bloat bond value

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateChannelStateBloatBond.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateChannelStateBloatBond.ts)_

## `joystream-cli content:updateCuratorGroupPermissions [ID]`

Update existing Curator Group.

```
USAGE
  $ joystream-cli content:updateCuratorGroupPermissions [ID]

ARGUMENTS
  ID  ID of the Curator Group

OPTIONS
  -p, --permissions=permissions  (required) Path to JSON file containing moderation permissions by channel privilege
                                 level to use as input

  --useMemberId=useMemberId      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateCuratorGroupPermissions.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateCuratorGroupPermissions.ts)_

## `joystream-cli content:updateVideo VIDEOID`

Update video under specific id.

```
USAGE
  $ joystream-cli content:updateVideo VIDEOID

ARGUMENTS
  VIDEOID  ID of the Video

OPTIONS
  -i, --input=input               (required) Path to JSON file to use as input
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
  --useMemberId=useMemberId       Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId       Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateVideo.ts)_

## `joystream-cli content:updateVideoCategory VIDEOCATEGORYID`

Update video category inside content directory.

```
USAGE
  $ joystream-cli content:updateVideoCategory VIDEOCATEGORYID

ARGUMENTS
  VIDEOCATEGORYID  ID of the Video Category

OPTIONS
  -i, --input=input          (required) Path to JSON file to use as input
  --context=(Lead|Curator)   Actor context to execute the command in (Lead/Curator)
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateVideoCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateVideoCategory.ts)_

## `joystream-cli content:updateVideoStateBloatBond VALUE`

Update video state bloat bond.

```
USAGE
  $ joystream-cli content:updateVideoStateBloatBond VALUE

ARGUMENTS
  VALUE  New state bloat bond value

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/updateVideoStateBloatBond.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateVideoStateBloatBond.ts)_

## `joystream-cli content:video VIDEOID`

Show Video details by id.

```
USAGE
  $ joystream-cli content:video VIDEOID

ARGUMENTS
  VIDEOID  ID of the Video

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/video.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/video.ts)_

## `joystream-cli content:videos [CHANNELID]`

List existing content directory videos.

```
USAGE
  $ joystream-cli content:videos [CHANNELID]

ARGUMENTS
  CHANNELID  ID of the Channel

OPTIONS
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/content/videos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/videos.ts)_

## `joystream-cli forum:addPost`

Add forum post.

```
USAGE
  $ joystream-cli forum:addPost

OPTIONS
  --categoryId=categoryId    (required) Id of the forum category of the parent thread
  --editable                 Whether the post should be editable
  --text=text                (required) Post content (md-formatted text)
  --threadId=threadId        (required) Post's parent thread
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/addPost.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/addPost.ts)_

## `joystream-cli forum:categories`

List existing forum categories by parent id (root categories by default) or displays a category tree.

```
USAGE
  $ joystream-cli forum:categories

OPTIONS
  -c, --tree                               Display a category tree (with parentCategoryId as root, if specified)
  -p, --parentCategoryId=parentCategoryId  Parent category id (only child categories will be listed)
  --useMemberId=useMemberId                Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId                Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/categories.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/categories.ts)_

## `joystream-cli forum:category`

Display forum category details.

```
USAGE
  $ joystream-cli forum:category

OPTIONS
  -c, --categoryId=categoryId  (required) Forum category id
  --useMemberId=useMemberId    Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId    Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/category.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/category.ts)_

## `joystream-cli forum:createCategory`

Create forum category.

```
USAGE
  $ joystream-cli forum:createCategory

OPTIONS
  -d, --description=description            (required) Category description
  -p, --parentCategoryId=parentCategoryId  Parent category id (in case of creating a subcategory)
  -t, --title=title                        (required) Category title
  --useMemberId=useMemberId                Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId                Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/createCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/createCategory.ts)_

## `joystream-cli forum:createThread`

Create forum thread.

```
USAGE
  $ joystream-cli forum:createThread

OPTIONS
  --categoryId=categoryId    (required) Id of the forum category the thread should be created in
  --tags=tags                Space-separated tags to associate with the thread
  --text=text                (required) Initial post text
  --title=title              (required) Thread title
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/createThread.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/createThread.ts)_

## `joystream-cli forum:deleteCategory`

Delete forum category provided it has no existing subcategories and threads.

```
USAGE
  $ joystream-cli forum:deleteCategory

OPTIONS
  -c, --categoryId=categoryId   (required) Id of the category to delete
  --context=(Leader|Moderator)  Actor context to execute the command in (Leader/Moderator)
  --useMemberId=useMemberId     Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId     Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/deleteCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/deleteCategory.ts)_

## `joystream-cli forum:moderatePost`

Moderate a forum post and slash the associated stake.

```
USAGE
  $ joystream-cli forum:moderatePost

OPTIONS
  -c, --categoryId=categoryId   (required) Forum category id
  -p, --postId=postId           (required) Forum post id
  -r, --rationale=rationale     (required) Rationale behind the post moderation.
  -t, --threadId=threadId       (required) Forum thread id
  --context=(Leader|Moderator)  Actor context to execute the command in (Leader/Moderator)
  --useMemberId=useMemberId     Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId     Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/moderatePost.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/moderatePost.ts)_

## `joystream-cli forum:moderateThread`

Moderate a forum thread and slash the associated stake.

```
USAGE
  $ joystream-cli forum:moderateThread

OPTIONS
  -c, --categoryId=categoryId   (required) Id of the forum category the thread is currently in
  -r, --rationale=rationale     (required) Rationale behind the thread moderation.
  -t, --threadId=threadId       (required) Forum thread id
  --context=(Leader|Moderator)  Actor context to execute the command in (Leader/Moderator)
  --useMemberId=useMemberId     Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId     Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/moderateThread.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/moderateThread.ts)_

## `joystream-cli forum:moveThread`

Move forum thread to a different category.

```
USAGE
  $ joystream-cli forum:moveThread

OPTIONS
  -c, --categoryId=categoryId        (required) Thread's current category id
  -n, --newCategoryId=newCategoryId  (required) Thread's new category id
  -t, --threadId=threadId            (required) Forum thread id
  --context=(Leader|Moderator)       Actor context to execute the command in (Leader/Moderator)
  --useMemberId=useMemberId          Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId          Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/moveThread.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/moveThread.ts)_

## `joystream-cli forum:posts`

List existing forum posts in given thread.

```
USAGE
  $ joystream-cli forum:posts

OPTIONS
  -t, --threadId=threadId    (required) Thread id (only posts in this thread will be listed)
  --useMemberId=useMemberId  Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId  Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/posts.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/posts.ts)_

## `joystream-cli forum:setStickiedThreads`

Set stickied threads in a given category.

```
USAGE
  $ joystream-cli forum:setStickiedThreads

OPTIONS
  --categoryId=categoryId       (required) Forum category id
  --context=(Leader|Moderator)  Actor context to execute the command in (Leader/Moderator)
  --threadIds=threadIds         Space-separated thread ids
  --useMemberId=useMemberId     Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId     Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/setStickiedThreads.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/setStickiedThreads.ts)_

## `joystream-cli forum:threads`

List existing forum threads in given category.

```
USAGE
  $ joystream-cli forum:threads

OPTIONS
  -c, --categoryId=categoryId  (required) Category id (only threads in this category will be listed)
  --useMemberId=useMemberId    Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId    Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/threads.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/threads.ts)_

## `joystream-cli forum:updateCategoryArchivalStatus`

Update archival status of a forum category.

```
USAGE
  $ joystream-cli forum:updateCategoryArchivalStatus

OPTIONS
  -c, --categoryId=categoryId   (required) Forum category id
  --archived=(yes|no)           (required) Whether the category should be archived
  --context=(Leader|Moderator)  Actor context to execute the command in (Leader/Moderator)
  --useMemberId=useMemberId     Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId     Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/updateCategoryArchivalStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/updateCategoryArchivalStatus.ts)_

## `joystream-cli forum:updateCategoryModeratorStatus`

Update moderator status of a worker in relation to a category.

```
USAGE
  $ joystream-cli forum:updateCategoryModeratorStatus

OPTIONS
  -c, --categoryId=categoryId  (required) Forum category id
  -w, --workerId=workerId      (required) Forum working group worker id
  --status=(active|disabled)   (required) Status of the moderator membership in the category
  --useMemberId=useMemberId    Try using the specified member id as context whenever possible
  --useWorkerId=useWorkerId    Try using the specified worker id as context whenever possible
```

_See code: [src/commands/forum/updateCategoryModeratorStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/forum/updateCategoryModeratorStatus.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `joystream-cli membership:addStakingAccount`

Associate a new staking account with an existing membership.

```
USAGE
  $ joystream-cli membership:addStakingAccount

OPTIONS
  --address=address          Address of the staking account to be associated with the member

  --fundsSource=fundsSource  If provided, this account will be used as funds source for the purpose of initializing the
                             staking accout

  --useMemberId=useMemberId  Try using the specified member id as context whenever possible

  --withBalance=withBalance  Allows optionally specifying required initial balance for the staking account
```

_See code: [src/commands/membership/addStakingAccount.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/membership/addStakingAccount.ts)_

## `joystream-cli membership:buy`

Buy / register a new membership on the Joystream platform.

```
USAGE
  $ joystream-cli membership:buy

OPTIONS
  --about=about                  Member's md-formatted about text (bio)
  --avatarUri=avatarUri          Member's avatar uri
  --controllerKey=controllerKey  Member's controller key. Can also be provided interactively.
  --handle=handle                (required) Member's handle
  --name=name                    Member's first name / full name
  --rootKey=rootKey              Member's root key. Can also be provided interactively.
  --senderKey=senderKey          Tx sender key. If not provided, controllerKey will be used by default.

ALIASES
  $ joystream-cli membership:create
  $ joystream-cli membership:register
```

_See code: [src/commands/membership/buy.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/membership/buy.ts)_

## `joystream-cli membership:details`

Display membership details by specified memberId.

```
USAGE
  $ joystream-cli membership:details

OPTIONS
  -m, --memberId=memberId  (required) Member id

ALIASES
  $ joystream-cli membership:info
  $ joystream-cli membership:inspect
  $ joystream-cli membership:show
```

_See code: [src/commands/membership/details.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/membership/details.ts)_

## `joystream-cli membership:update`

Update existing membership metadata and/or handle.

```
USAGE
  $ joystream-cli membership:update

OPTIONS
  --newAbout=newAbout          Member's new md-formatted about text (bio)
  --newAvatarUri=newAvatarUri  Member's new avatar uri
  --newHandle=newHandle        Member's new handle
  --newName=newName            Member's new first name / full name
  --useMemberId=useMemberId    Try using the specified member id as context whenever possible
```

_See code: [src/commands/membership/update.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/membership/update.ts)_

## `joystream-cli membership:updateAccounts`

Update existing membership accounts/keys (root / controller).

```
USAGE
  $ joystream-cli membership:updateAccounts

OPTIONS
  --newControllerAccount=newControllerAccount  Member's new controller account/key
  --newRootAccount=newRootAccount              Member's new root account/key
  --useMemberId=useMemberId                    Try using the specified member id as context whenever possible
```

_See code: [src/commands/membership/updateAccounts.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/membership/updateAccounts.ts)_

## `joystream-cli staking:validate`

Start validating. Takes the controller key.

```
USAGE
  $ joystream-cli staking:validate

OPTIONS
  --commission=commission  Set a commission (0-100), which is deducted from all rewards before the remainder is split
                           with nominator

  --controller=controller  The controller key you want to validate with.
```

_See code: [src/commands/staking/validate.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/staking/validate.ts)_

## `joystream-cli working-groups:application WGAPPLICATIONID`

Shows an overview of given application by Working Group Application ID

```
USAGE
  $ joystream-cli working-groups:application WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/application.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/application.ts)_

## `joystream-cli working-groups:apply`

Apply to a working group opening (requires a membership)

```
USAGE
  $ joystream-cli working-groups:apply

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --answers=answers
      Answers for opening's application form questions (sorted by question index)

  --openingId=openingId
      (required) Opening ID

  --rewardAccount=rewardAccount
      Future worker reward account

  --roleAccount=roleAccount
      Future worker role account

  --stakingAccount=stakingAccount
      Account to hold applicant's / worker's stake

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/apply.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/apply.ts)_

## `joystream-cli working-groups:cancelOpening OPENINGID`

Cancels (removes) an active opening

```
USAGE
  $ joystream-cli working-groups:cancelOpening OPENINGID

ARGUMENTS
  OPENINGID  Opening ID

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/cancelOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/cancelOpening.ts)_

## `joystream-cli working-groups:createOpening`

Create working group opening / upcoming opening (requires lead access)

```
USAGE
  $ joystream-cli working-groups:createOpening

OPTIONS
  -e, --edit
      If provided along with --input - launches in edit mode allowing to modify the input before sending the exstinsic

  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  -i, --input=input
      Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output
      Path to the file where the output JSON should be saved (this output can be then reused as input)

  --dryRun
      If provided along with --output - skips sending the actual extrinsic(can be used to generate a "draft" which can be
      provided as input later)

  --stakeTopUpSource=stakeTopUpSource
      If provided - this account (key) will be used as default funds source for lead stake top up (in case it's needed)

  --startsAt=startsAt
      If upcoming opening - the expected opening start date (YYYY-MM-DD HH:mm:ss)

  --upcoming
      Whether the opening should be an upcoming opening

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/createOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/createOpening.ts)_

## `joystream-cli working-groups:decreaseWorkerStake WORKERID AMOUNT`

Decreases given worker stake by an amount that will be returned to the worker role account. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:decreaseWorkerStake WORKERID AMOUNT

ARGUMENTS
  WORKERID  Worker ID
  AMOUNT    Amount of JOY to decrease the current worker stake by

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
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
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --penalty=penalty
      Optional penalty in JOY

  --rationale=rationale
      Optional rationale

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/evictWorker.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/evictWorker.ts)_

## `joystream-cli working-groups:fillOpening`

Allows filling working group opening that's currently in review. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:fillOpening

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --applicationIds=applicationIds
      Accepted application ids

  --openingId=openingId
      (required) Working Group Opening ID

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/fillOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/fillOpening.ts)_

## `joystream-cli working-groups:increaseStake AMOUNT`

Increases current role (lead/worker) stake. Requires active role account to be selected.

```
USAGE
  $ joystream-cli working-groups:increaseStake AMOUNT

ARGUMENTS
  AMOUNT  Amount of JOY to increase the current stake by

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/increaseStake.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/increaseStake.ts)_

## `joystream-cli working-groups:leaveRole`

Leave the worker or lead role associated with currently selected account.

```
USAGE
  $ joystream-cli working-groups:leaveRole

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --rationale=rationale

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/leaveRole.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/leaveRole.ts)_

## `joystream-cli working-groups:opening`

Shows detailed information about working group opening / upcoming opening by id

```
USAGE
  $ joystream-cli working-groups:opening

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --id=id
      (required) Opening / upcoming opening id (depending on --upcoming flag)

  --upcoming
      Whether the opening is an upcoming opening

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/opening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/opening.ts)_

## `joystream-cli working-groups:openings`

Lists active/upcoming openings in a given working group

```
USAGE
  $ joystream-cli working-groups:openings

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --upcoming
      List upcoming openings (active openings are listed by default)

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/openings.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/openings.ts)_

## `joystream-cli working-groups:overview`

Shows an overview of given working group (current lead and workers)

```
USAGE
  $ joystream-cli working-groups:overview

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/overview.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/overview.ts)_

## `joystream-cli working-groups:removeUpcomingOpening`

Remove an existing upcoming opening by sending RemoveUpcomingOpening metadata signal (requires lead access)

```
USAGE
  $ joystream-cli working-groups:removeUpcomingOpening

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  -i, --id=id
      (required) Id of the upcoming opening to remove

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/removeUpcomingOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/removeUpcomingOpening.ts)_

## `joystream-cli working-groups:setDefaultGroup`

Change the default group context for working-groups commands.

```
USAGE
  $ joystream-cli working-groups:setDefaultGroup

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/setDefaultGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/setDefaultGroup.ts)_

## `joystream-cli working-groups:slashWorker WORKERID AMOUNT`

Slashes given worker stake. Requires lead access.

```
USAGE
  $ joystream-cli working-groups:slashWorker WORKERID AMOUNT

ARGUMENTS
  WORKERID  Worker ID
  AMOUNT    Slash amount

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --rationale=rationale

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/slashWorker.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/slashWorker.ts)_

## `joystream-cli working-groups:updateGroupMetadata`

Update working group metadata (description, status etc.). The update will be atomic (just like video / channel metadata updates)

```
USAGE
  $ joystream-cli working-groups:updateGroupMetadata

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  -i, --input=input
      (required) Path to JSON file to use as input

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/updateGroupMetadata.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateGroupMetadata.ts)_

## `joystream-cli working-groups:updateRewardAccount [ADDRESS]`

Updates the worker/lead reward account (requires current role account to be selected)

```
USAGE
  $ joystream-cli working-groups:updateRewardAccount [ADDRESS]

ARGUMENTS
  ADDRESS  New reward account address (if omitted, can be provided interactivel)

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/updateRewardAccount.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRewardAccount.ts)_

## `joystream-cli working-groups:updateRoleAccount [ADDRESS]`

Updates the worker/lead role account. Requires member controller account to be selected

```
USAGE
  $ joystream-cli working-groups:updateRoleAccount [ADDRESS]

ARGUMENTS
  ADDRESS  New role account address (if omitted, can be provided interactively)

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/updateRoleAccount.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRoleAccount.ts)_

## `joystream-cli working-groups:updateRoleStorage STORAGE`

Updates the associated worker storage

```
USAGE
  $ joystream-cli working-groups:updateRoleStorage STORAGE

ARGUMENTS
  STORAGE  Worker storage

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/updateRoleStorage.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRoleStorage.ts)_

## `joystream-cli working-groups:updateWorkerReward WORKERID NEWREWARD`

Change given worker's reward (amount only). Requires lead access.

```
USAGE
  $ joystream-cli working-groups:updateWorkerReward WORKERID NEWREWARD

ARGUMENTS
  WORKERID   Worker ID
  NEWREWARD  New reward

OPTIONS
  -g, --group=(storageProviders|curators|forum|membership|gateway|builders|humanResources|marketing|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, forum, membership, gateway, builders, humanResources, marketing,
      distributors.

  --useMemberId=useMemberId
      Try using the specified member id as context whenever possible

  --useWorkerId=useWorkerId
      Try using the specified worker id as context whenever possible
```

_See code: [src/commands/working-groups/updateWorkerReward.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateWorkerReward.ts)_

<!-- commandsstop -->
