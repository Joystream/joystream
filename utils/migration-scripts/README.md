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
migration-scripts/0.1.0 linux-x64 node-v14.16.1
$ migration-scripts --help [COMMAND]
USAGE
  $ migration-scripts COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`migration-scripts giza:migrateContent`](#migration-scripts-gizamigratecontent)
* [`migration-scripts giza:retryFailedUploads`](#migration-scripts-gizaretryfaileduploads)
* [`migration-scripts help [COMMAND]`](#migration-scripts-help-command)

## `migration-scripts giza:migrateContent`

```
USAGE
  $ migration-scripts giza:migrateContent

OPTIONS
  -c, --channelIds=channelIds                                  (required) Channel ids to migrate
  --channelBatchSize=channelBatchSize                          [default: 100] Channel batch size

  --dataDir=dataDir                                            [default: /tmp/joystream/giza-migration] Directory for
                                                               storing data objects to upload

  --dev                                                        Turns on dev mode

  --migrationStatePath=migrationStatePath                      [default:
                                                               /home/leszek/projects/joystream/joystream-ws-1/utils/migr
                                                               ation-scripts/results/giza] Path to migration
                                                               state/results directory

  --preferredDownloadSpEndpoints=preferredDownloadSpEndpoints  [default: https://rome-rpc-4.joystream.org] Preferred
                                                               storage node endpoints when downloading data objects
                                                               (comma-separated)

  --queryNodeUri=queryNodeUri                                  [default: https://hydra.joystream.org/graphql] Query node
                                                               uri

  --sudoUri=sudoUri                                            [default: //Alice] Sudo key Substrate uri

  --uploadMemberControllerUri=uploadMemberControllerUri        [default: //Alice] Giza upload member controller uri

  --uploadMemberId=uploadMemberId                              [default: 0] Giza member id to use for uploading

  --uploadSpBucketId=uploadSpBucketId                          [default: 0] Giza storage bucket id

  --uploadSpEndpoint=uploadSpEndpoint                          [default: http://localhost:3333] Giza storage node
                                                               endpoint to use for uploading

  --videoBatchSize=videoBatchSize                              [default: 100] Video batch size

  --wsProviderEndpointUri=wsProviderEndpointUri                [default: ws://localhost:9944] WS provider endpoint uri
                                                               (Giza)
```

_See code: [src/commands/giza/migrateContent.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/giza/migrateContent.ts)_

## `migration-scripts giza:retryFailedUploads`

```
USAGE
  $ migration-scripts giza:retryFailedUploads

OPTIONS
  -f, --failedUploadsPath=failedUploadsPath              (required) Path to failed uploads file

  --dataDir=dataDir                                      [default: /tmp/joystream/giza-migration] Directory for storing
                                                         data objects to upload

  --uploadMemberControllerUri=uploadMemberControllerUri  [default: //Alice] Giza upload member controller uri

  --uploadMemberId=uploadMemberId                        [default: 0] Giza member id to use for uploading

  --uploadSpBucketId=uploadSpBucketId                    [default: 0] Giza storage bucket id

  --uploadSpEndpoint=uploadSpEndpoint                    [default: http://localhost:3333] Giza storage node endpoint to
                                                         use for uploading

  --wsProviderEndpointUri=wsProviderEndpointUri          [default: ws://localhost:9944] WS provider endpoint uri (Giza)
```

_See code: [src/commands/giza/retryFailedUploads.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/giza/retryFailedUploads.ts)_

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
<!-- commandsstop -->
