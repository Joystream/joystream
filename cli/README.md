@joystream/cli
=============

Command Line Interface for Joystream community and governance activities

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@joystream/cli.svg)](https://npmjs.org/package/@joystream/cli)
[![License](https://img.shields.io/npm/l/@joystream/cli.svg)](https://github.com/Joystream/joystream/blob/master/cli/package.json)

<!-- toc -->
* [Usage](#usage)
* [Development](#development)
* [First steps](#first-steps)
* [Useful environment settings](#useful-environment-settings)
* [Commands](#commands)
<!-- tocstop -->

# Usage
<!-- usage -->
```sh-session
$ npm install -g @joystream/cli
$ joystream-cli COMMAND
running command...
$ joystream-cli (-v|--version|version)
@joystream/cli/0.6.0 linux-x64 node-v14.18.0
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
* [`joystream-cli account:create`](#joystream-cli-accountcreate)
* [`joystream-cli account:export DESTPATH`](#joystream-cli-accountexport-destpath)
* [`joystream-cli account:forget`](#joystream-cli-accountforget)
* [`joystream-cli account:import`](#joystream-cli-accountimport)
* [`joystream-cli account:info [ADDRESS]`](#joystream-cli-accountinfo-address)
* [`joystream-cli account:list`](#joystream-cli-accountlist)
* [`joystream-cli account:transferTokens`](#joystream-cli-accounttransfertokens)
* [`joystream-cli api:getQueryNodeEndpoint`](#joystream-cli-apigetquerynodeendpoint)
* [`joystream-cli api:getUri`](#joystream-cli-apigeturi)
* [`joystream-cli api:inspect`](#joystream-cli-apiinspect)
* [`joystream-cli api:setQueryNodeEndpoint [ENDPOINT]`](#joystream-cli-apisetquerynodeendpoint-endpoint)
* [`joystream-cli api:setUri [URI]`](#joystream-cli-apiseturi-uri)
* [`joystream-cli autocomplete [SHELL]`](#joystream-cli-autocomplete-shell)
* [`joystream-cli content:addCuratorToGroup [GROUPID] [CURATORID]`](#joystream-cli-contentaddcuratortogroup-groupid-curatorid)
* [`joystream-cli content:channel CHANNELID`](#joystream-cli-contentchannel-channelid)
* [`joystream-cli content:channels`](#joystream-cli-contentchannels)
* [`joystream-cli content:createChannel`](#joystream-cli-contentcreatechannel)
* [`joystream-cli content:createChannelCategory`](#joystream-cli-contentcreatechannelcategory)
* [`joystream-cli content:createCuratorGroup`](#joystream-cli-contentcreatecuratorgroup)
* [`joystream-cli content:createVideo`](#joystream-cli-contentcreatevideo)
* [`joystream-cli content:createVideoCategory`](#joystream-cli-contentcreatevideocategory)
* [`joystream-cli content:curatorGroup ID`](#joystream-cli-contentcuratorgroup-id)
* [`joystream-cli content:curatorGroups`](#joystream-cli-contentcuratorgroups)
* [`joystream-cli content:deleteChannel`](#joystream-cli-contentdeletechannel)
* [`joystream-cli content:deleteChannelCategory CHANNELCATEGORYID`](#joystream-cli-contentdeletechannelcategory-channelcategoryid)
* [`joystream-cli content:deleteVideo`](#joystream-cli-contentdeletevideo)
* [`joystream-cli content:deleteVideoCategory VIDEOCATEGORYID`](#joystream-cli-contentdeletevideocategory-videocategoryid)
* [`joystream-cli content:removeChannelAssets`](#joystream-cli-contentremovechannelassets)
* [`joystream-cli content:removeCuratorFromGroup [GROUPID] [CURATORID]`](#joystream-cli-contentremovecuratorfromgroup-groupid-curatorid)
* [`joystream-cli content:reuploadAssets`](#joystream-cli-contentreuploadassets)
* [`joystream-cli content:setCuratorGroupStatus [ID] [STATUS]`](#joystream-cli-contentsetcuratorgroupstatus-id-status)
* [`joystream-cli content:setFeaturedVideos FEATUREDVIDEOIDS`](#joystream-cli-contentsetfeaturedvideos-featuredvideoids)
* [`joystream-cli content:updateChannel CHANNELID`](#joystream-cli-contentupdatechannel-channelid)
* [`joystream-cli content:updateChannelCategory CHANNELCATEGORYID`](#joystream-cli-contentupdatechannelcategory-channelcategoryid)
* [`joystream-cli content:updateChannelCensorshipStatus ID [STATUS]`](#joystream-cli-contentupdatechannelcensorshipstatus-id-status)
* [`joystream-cli content:updateVideo VIDEOID`](#joystream-cli-contentupdatevideo-videoid)
* [`joystream-cli content:updateVideoCategory VIDEOCATEGORYID`](#joystream-cli-contentupdatevideocategory-videocategoryid)
* [`joystream-cli content:updateVideoCensorshipStatus ID [STATUS]`](#joystream-cli-contentupdatevideocensorshipstatus-id-status)
* [`joystream-cli content:video VIDEOID`](#joystream-cli-contentvideo-videoid)
* [`joystream-cli content:videos [CHANNELID]`](#joystream-cli-contentvideos-channelid)
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
* [`joystream-cli working-groups:setDefaultGroup`](#joystream-cli-working-groupssetdefaultgroup)
* [`joystream-cli working-groups:slashWorker WORKERID`](#joystream-cli-working-groupsslashworker-workerid)
* [`joystream-cli working-groups:startAcceptingApplications WGOPENINGID`](#joystream-cli-working-groupsstartacceptingapplications-wgopeningid)
* [`joystream-cli working-groups:startReviewPeriod WGOPENINGID`](#joystream-cli-working-groupsstartreviewperiod-wgopeningid)
* [`joystream-cli working-groups:terminateApplication WGAPPLICATIONID`](#joystream-cli-working-groupsterminateapplication-wgapplicationid)
* [`joystream-cli working-groups:updateRewardAccount [ADDRESS]`](#joystream-cli-working-groupsupdaterewardaccount-address)
* [`joystream-cli working-groups:updateRoleAccount [ADDRESS]`](#joystream-cli-working-groupsupdateroleaccount-address)
* [`joystream-cli working-groups:updateRoleStorage STORAGE`](#joystream-cli-working-groupsupdaterolestorage-storage)
* [`joystream-cli working-groups:updateWorkerReward WORKERID`](#joystream-cli-working-groupsupdateworkerreward-workerid)

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
```

_See code: [src/commands/content/addCuratorToGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/addCuratorToGroup.ts)_

## `joystream-cli content:channel CHANNELID`

Show Channel details by id.

```
USAGE
  $ joystream-cli content:channel CHANNELID

ARGUMENTS
  CHANNELID  Name or ID of the Channel
```

_See code: [src/commands/content/channel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/channel.ts)_

## `joystream-cli content:channels`

List existing content directory channels.

```
USAGE
  $ joystream-cli content:channels
```

_See code: [src/commands/content/channels.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/channels.ts)_

## `joystream-cli content:createChannel`

Create channel inside content directory.

```
USAGE
  $ joystream-cli content:createChannel

OPTIONS
  -i, --input=input           (required) Path to JSON file to use as input
  --context=(Member|Curator)  Actor context to execute the command in (Member/Curator)
```

_See code: [src/commands/content/createChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createChannel.ts)_

## `joystream-cli content:createChannelCategory`

Create channel category inside content directory.

```
USAGE
  $ joystream-cli content:createChannelCategory

OPTIONS
  -i, --input=input         (required) Path to JSON file to use as input
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
```

_See code: [src/commands/content/createChannelCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createChannelCategory.ts)_

## `joystream-cli content:createCuratorGroup`

Create new Curator Group.

```
USAGE
  $ joystream-cli content:createCuratorGroup

ALIASES
  $ joystream-cli createCuratorGroup
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
```

_See code: [src/commands/content/createVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createVideo.ts)_

## `joystream-cli content:createVideoCategory`

Create video category inside content directory.

```
USAGE
  $ joystream-cli content:createVideoCategory

OPTIONS
  -i, --input=input         (required) Path to JSON file to use as input
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
```

_See code: [src/commands/content/createVideoCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/createVideoCategory.ts)_

## `joystream-cli content:curatorGroup ID`

Show Curator Group details by ID.

```
USAGE
  $ joystream-cli content:curatorGroup ID

ARGUMENTS
  ID  ID of the Curator Group
```

_See code: [src/commands/content/curatorGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/curatorGroup.ts)_

## `joystream-cli content:curatorGroups`

List existing Curator Groups.

```
USAGE
  $ joystream-cli content:curatorGroups
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
```

_See code: [src/commands/content/deleteChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteChannel.ts)_

## `joystream-cli content:deleteChannelCategory CHANNELCATEGORYID`

Delete channel category.

```
USAGE
  $ joystream-cli content:deleteChannelCategory CHANNELCATEGORYID

ARGUMENTS
  CHANNELCATEGORYID  ID of the Channel Category

OPTIONS
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
```

_See code: [src/commands/content/deleteChannelCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteChannelCategory.ts)_

## `joystream-cli content:deleteVideo`

Delete the video and optionally all associated data objects.

```
USAGE
  $ joystream-cli content:deleteVideo

OPTIONS
  -f, --force                     Force-remove all associated video data objects
  -v, --videoId=videoId           (required) ID of the Video
  --context=(Owner|Collaborator)  Actor context to execute the command in (Owner/Collaborator)
```

_See code: [src/commands/content/deleteVideo.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/deleteVideo.ts)_

## `joystream-cli content:deleteVideoCategory VIDEOCATEGORYID`

Delete video category.

```
USAGE
  $ joystream-cli content:deleteVideoCategory VIDEOCATEGORYID

ARGUMENTS
  VIDEOCATEGORYID  ID of the Video Category

OPTIONS
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
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
```

_See code: [src/commands/content/removeCuratorFromGroup.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/removeCuratorFromGroup.ts)_

## `joystream-cli content:reuploadAssets`

Allows reuploading assets that were not successfully uploaded during channel/video creation

```
USAGE
  $ joystream-cli content:reuploadAssets

OPTIONS
  -i, --input=input  (required) Path to JSON file containing array of assets to reupload (contentIds and paths)
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
```

_See code: [src/commands/content/setCuratorGroupStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/setCuratorGroupStatus.ts)_

## `joystream-cli content:setFeaturedVideos FEATUREDVIDEOIDS`

Set featured videos. Requires lead access.

```
USAGE
  $ joystream-cli content:setFeaturedVideos FEATUREDVIDEOIDS

ARGUMENTS
  FEATUREDVIDEOIDS  Comma-separated video IDs (ie. 1,2,3)
```

_See code: [src/commands/content/setFeaturedVideos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/setFeaturedVideos.ts)_

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
```

_See code: [src/commands/content/updateChannel.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateChannel.ts)_

## `joystream-cli content:updateChannelCategory CHANNELCATEGORYID`

Update channel category inside content directory.

```
USAGE
  $ joystream-cli content:updateChannelCategory CHANNELCATEGORYID

ARGUMENTS
  CHANNELCATEGORYID  ID of the Channel Category

OPTIONS
  -i, --input=input         (required) Path to JSON file to use as input
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
```

_See code: [src/commands/content/updateChannelCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateChannelCategory.ts)_

## `joystream-cli content:updateChannelCensorshipStatus ID [STATUS]`

Update Channel censorship status (Censored / Not censored).

```
USAGE
  $ joystream-cli content:updateChannelCensorshipStatus ID [STATUS]

ARGUMENTS
  ID      ID of the Channel
  STATUS  New censorship status of the channel (1 - censored, 0 - not censored)

OPTIONS
  --rationale=rationale  rationale
```

_See code: [src/commands/content/updateChannelCensorshipStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateChannelCensorshipStatus.ts)_

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
  -i, --input=input         (required) Path to JSON file to use as input
  --context=(Lead|Curator)  Actor context to execute the command in (Lead/Curator)
```

_See code: [src/commands/content/updateVideoCategory.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateVideoCategory.ts)_

## `joystream-cli content:updateVideoCensorshipStatus ID [STATUS]`

Update Video censorship status (Censored / Not censored).

```
USAGE
  $ joystream-cli content:updateVideoCensorshipStatus ID [STATUS]

ARGUMENTS
  ID      ID of the Video
  STATUS  New video censorship status (1 - censored, 0 - not censored)

OPTIONS
  --rationale=rationale  rationale
```

_See code: [src/commands/content/updateVideoCensorshipStatus.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/updateVideoCensorshipStatus.ts)_

## `joystream-cli content:video VIDEOID`

Show Video details by id.

```
USAGE
  $ joystream-cli content:video VIDEOID

ARGUMENTS
  VIDEOID  ID of the Video
```

_See code: [src/commands/content/video.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/video.ts)_

## `joystream-cli content:videos [CHANNELID]`

List existing content directory videos.

```
USAGE
  $ joystream-cli content:videos [CHANNELID]

ARGUMENTS
  CHANNELID  ID of the Channel
```

_See code: [src/commands/content/videos.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/content/videos.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `joystream-cli working-groups:application WGAPPLICATIONID`

Shows an overview of given application by Working Group Application ID

```
USAGE
  $ joystream-cli working-groups:application WGAPPLICATIONID

ARGUMENTS
  WGAPPLICATIONID  Working Group Application ID

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/application.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/application.ts)_

## `joystream-cli working-groups:createOpening`

Create working group opening (requires lead access)

```
USAGE
  $ joystream-cli working-groups:createOpening

OPTIONS
  -e, --edit
      If provided along with --input - launches in edit mode allowing to modify the input before sending the exstinsic

  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.

  -i, --input=input
      Path to JSON file to use as input (if not specified - the input can be provided interactively)

  -o, --output=output
      Path to the file where the output JSON should be saved (this output can be then reused as input)

  --dryRun
      If provided along with --output - skips sending the actual extrinsic(can be used to generate a "draft" which can be 
      provided as input later)
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/fillOpening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/fillOpening.ts)_

## `joystream-cli working-groups:increaseStake`

Increases current role (lead/worker) stake. Requires active role account to be selected.

```
USAGE
  $ joystream-cli working-groups:increaseStake

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/increaseStake.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/increaseStake.ts)_

## `joystream-cli working-groups:leaveRole`

Leave the worker or lead role associated with currently selected account.

```
USAGE
  $ joystream-cli working-groups:leaveRole

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/opening.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/opening.ts)_

## `joystream-cli working-groups:openings`

Shows an overview of given working group openings

```
USAGE
  $ joystream-cli working-groups:openings

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/openings.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/openings.ts)_

## `joystream-cli working-groups:overview`

Shows an overview of given working group (current lead and workers)

```
USAGE
  $ joystream-cli working-groups:overview

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/overview.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/overview.ts)_

## `joystream-cli working-groups:setDefaultGroup`

Change the default group context for working-groups commands.

```
USAGE
  $ joystream-cli working-groups:setDefaultGroup

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/terminateApplication.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/terminateApplication.ts)_

## `joystream-cli working-groups:updateRewardAccount [ADDRESS]`

Updates the worker/lead reward account (requires current role account to be selected)

```
USAGE
  $ joystream-cli working-groups:updateRewardAccount [ADDRESS]

ARGUMENTS
  ADDRESS  New reward account address (if omitted, can be provided interactivel)

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
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
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/updateRoleStorage.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateRoleStorage.ts)_

## `joystream-cli working-groups:updateWorkerReward WORKERID`

Change given worker's reward (amount only). Requires lead access.

```
USAGE
  $ joystream-cli working-groups:updateWorkerReward WORKERID

ARGUMENTS
  WORKERID  Worker ID

OPTIONS
  -g, --group=(storageProviders|curators|operationsAlpha|operationsBeta|operationsGamma|gateway|distributors)
      The working group context in which the command should be executed
      Available values are: storageProviders, curators, operationsAlpha, operationsBeta, operationsGamma, gateway, 
      distributors.
```

_See code: [src/commands/working-groups/updateWorkerReward.ts](https://github.com/Joystream/joystream/blob/master/cli/src/commands/working-groups/updateWorkerReward.ts)_
<!-- commandsstop -->
