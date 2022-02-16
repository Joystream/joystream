migrations
==========

Joystream migrations scripts

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/migrations.svg)](https://npmjs.org/package/migrations)
[![Downloads/week](https://img.shields.io/npm/dw/migrations.svg)](https://npmjs.org/package/migrations)
[![License](https://img.shields.io/npm/l/migrations.svg)](https://github.com/Joystream/joystream/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g migration-scripts
$ migration-scripts COMMAND
running command...
$ migration-scripts (-v|--version|version)
migration-scripts/0.1.0 linux-x64 node-v14.18.0
$ migration-scripts --help [COMMAND]
USAGE
  $ migration-scripts COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`migration-scripts giza-olympia:createContentDirectorySnapshot`](#migration-scripts-giza-olympiacreatecontentdirectorysnapshot)
* [`migration-scripts giza-olympia:fetchAllObjects`](#migration-scripts-giza-olympiafetchallobjects)
* [`migration-scripts giza-olympia:migrateContent`](#migration-scripts-giza-olympiamigratecontent)
* [`migration-scripts help [COMMAND]`](#migration-scripts-help-command)
* [`migration-scripts sumer-giza:migrateContent`](#migration-scripts-sumer-gizamigratecontent)
* [`migration-scripts sumer-giza:retryFailedUploads`](#migration-scripts-sumer-gizaretryfaileduploads)

## `migration-scripts giza-olympia:createContentDirectorySnapshot`

```
USAGE
  $ migration-scripts giza-olympia:createContentDirectorySnapshot

OPTIONS
  -o, --output=output          Output file path
  --queryNodeUri=queryNodeUri  [default: https://hydra.joystream.org/graphql] Giza query node uri
```

_See code: [src/commands/giza-olympia/createContentDirectorySnapshot.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/giza-olympia/createContentDirectorySnapshot.ts)_

## `migration-scripts giza-olympia:fetchAllObjects`

```
USAGE
  $ migration-scripts giza-olympia:fetchAllObjects

OPTIONS
  --continously                      Whether the script should run continously
  --dataDir=dataDir                  [default: /tmp/joystream/giza-olympia-migration] Directory for storing data objects

  --idleTime=idleTime                [default: 300] Time (in seconds) to remain idle in case no new data objects were
                                     found

  --objectsPerBatch=objectsPerBatch  [default: 20] Max. number of storage objects to fetch simultaneously

  --queryNodeUri=queryNodeUri        [default: https://hydra.joystream.org/graphql] Giza query node uri
```

_See code: [src/commands/giza-olympia/fetchAllObjects.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/giza-olympia/fetchAllObjects.ts)_

## `migration-scripts giza-olympia:migrateContent`

```
USAGE
  $ migration-scripts giza-olympia:migrateContent

OPTIONS
  -c, --channelIds=channelIds                            (required) Channel ids to migrate
  --channelBatchSize=channelBatchSize                    [default: 20] Channel batch size
  --dataDir=dataDir                                      (required) Directory where data objects to upload are stored
  --excludeVideoIds=excludeVideoIds                      [default: ] Video ids to exclude from migration

  --forceChannelOwnerMemberId=forceChannelOwnerMemberId  Can be used to force a specific channel owner for all channels,
                                                         allowing to easily test the script in dev environment

  --migrationStatePath=migrationStatePath                [default:
                                                         /home/leszek/projects/joystream/joystream-ws-2/utils/migration-
                                                         scripts/results/giza-olympia] Path to migration results
                                                         directory

  --snapshotFilePath=snapshotFilePath                    (required) Path to giza content directory snapshot (json)

  --sudoUri=sudoUri                                      [default: //Alice] Sudo key Substrate uri

  --uploadSpBucketId=uploadSpBucketId                    [default: 0] Olympia storage bucket id

  --uploadSpEndpoint=uploadSpEndpoint                    [default: http://localhost:3333] Olympia storage node endpoint
                                                         to use for uploading

  --videoBatchSize=videoBatchSize                        [default: 20] Video batch size

  --wsProviderEndpointUri=wsProviderEndpointUri          [default: ws://localhost:9944] WS provider endpoint uri
                                                         (Olympia)
```

_See code: [src/commands/giza-olympia/migrateContent.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/giza-olympia/migrateContent.ts)_

## `migration-scripts help [COMMAND]`

display help for migration-scripts

```
USAGE
  $ migration-scripts help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `migration-scripts sumer-giza:migrateContent`

```
USAGE
  $ migration-scripts sumer-giza:migrateContent

OPTIONS
  -c, --channelIds=channelIds                                  (required) Channel ids to migrate
  --channelBatchSize=channelBatchSize                          [default: 20] Channel batch size

  --dataDir=dataDir                                            [default: /tmp/joystream/sumer-giza-migration] Directory
                                                               for storing data objects to upload

  --excludeVideoIds=excludeVideoIds                            [default: ] Video ids to exclude from migration

  --forceChannelOwnerMemberId=forceChannelOwnerMemberId        Can be used to force a specific channel owner for all
                                                               channels, allowing to easily test the script in dev
                                                               environment

  --migrationStatePath=migrationStatePath                      [default:
                                                               /home/leszek/projects/joystream/joystream-ws-2/utils/migr
                                                               ation-scripts/results/sumer-giza] Path to migration
                                                               results directory

  --preferredDownloadSpEndpoints=preferredDownloadSpEndpoints  [default: https://storage-1.joystream.org/storage]
                                                               Preferred storage node endpoints when downloading data
                                                               objects

  --queryNodeUri=queryNodeUri                                  [default: https://hydra.joystream.org/graphql] Query node
                                                               uri

  --sudoUri=sudoUri                                            [default: //Alice] Sudo key Substrate uri

  --uploadSpBucketId=uploadSpBucketId                          [default: 0] Giza storage bucket id

  --uploadSpEndpoint=uploadSpEndpoint                          [default: http://localhost:3333] Giza storage node
                                                               endpoint to use for uploading

  --videoBatchSize=videoBatchSize                              [default: 20] Video batch size

  --wsProviderEndpointUri=wsProviderEndpointUri                [default: ws://localhost:9944] WS provider endpoint uri
                                                               (Giza)
```

_See code: [src/commands/sumer-giza/migrateContent.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/sumer-giza/migrateContent.ts)_

## `migration-scripts sumer-giza:retryFailedUploads`

```
USAGE
  $ migration-scripts sumer-giza:retryFailedUploads

OPTIONS
  -f, --failedUploadsPath=failedUploadsPath      (required) Path to failed uploads file

  --dataDir=dataDir                              [default: /tmp/joystream/sumer-giza-migration] Directory where data
                                                 objects to upload are stored

  --uploadSpBucketId=uploadSpBucketId            [default: 0] Giza storage bucket id

  --uploadSpEndpoint=uploadSpEndpoint            [default: http://localhost:3333] Giza storage node endpoint to use for
                                                 uploading

  --wsProviderEndpointUri=wsProviderEndpointUri  [default: ws://localhost:9944] WS provider endpoint uri (Giza)
```

_See code: [src/commands/sumer-giza/retryFailedUploads.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/sumer-giza/retryFailedUploads.ts)_
<!-- commandsstop -->
