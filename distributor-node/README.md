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
@joystream/distributor-cli/0.1.0 linux-x64 node-v14.17.3
$ joystream-distributor --help [COMMAND]
USAGE
  $ joystream-distributor COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`joystream-distributor dev:init`](#joystream-distributor-devinit)
* [`joystream-distributor help [COMMAND]`](#joystream-distributor-help-command)
* [`joystream-distributor leader:cancel-invitation`](#joystream-distributor-leadercancel-invitation)
* [`joystream-distributor leader:create-bucket`](#joystream-distributor-leadercreate-bucket)
* [`joystream-distributor leader:create-bucket-family`](#joystream-distributor-leadercreate-bucket-family)
* [`joystream-distributor leader:delete-bucket`](#joystream-distributor-leaderdelete-bucket)
* [`joystream-distributor leader:delete-bucket-family`](#joystream-distributor-leaderdelete-bucket-family)
* [`joystream-distributor leader:invite-bucket-operator`](#joystream-distributor-leaderinvite-bucket-operator)
* [`joystream-distributor leader:set-buckets-per-bag-limit`](#joystream-distributor-leaderset-buckets-per-bag-limit)
* [`joystream-distributor leader:update-bag`](#joystream-distributor-leaderupdate-bag)
* [`joystream-distributor leader:update-bucket-mode`](#joystream-distributor-leaderupdate-bucket-mode)
* [`joystream-distributor leader:update-bucket-status`](#joystream-distributor-leaderupdate-bucket-status)
* [`joystream-distributor leader:update-dynamic-bag-policy`](#joystream-distributor-leaderupdate-dynamic-bag-policy)
* [`joystream-distributor operator:accept-invitation`](#joystream-distributor-operatoraccept-invitation)
* [`joystream-distributor operator:set-metadata`](#joystream-distributor-operatorset-metadata)
* [`joystream-distributor start`](#joystream-distributor-start)

## `joystream-distributor dev:init`

Initialize development environment. Sets Alice as distributor working group leader.

```
USAGE
  $ joystream-distributor dev:init

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/dev/init.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/dev/init.ts)_

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

## `joystream-distributor leader:cancel-invitation`

Cancel pending distribution bucket operator invitation.

```
USAGE
  $ joystream-distributor leader:cancel-invitation

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -w, --workerId=workerId      (required) ID of the invited operator (distribution group worker)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires distribution working group leader permissions.
```

_See code: [src/commands/leader/cancel-invitation.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/cancel-invitation.ts)_

## `joystream-distributor leader:create-bucket`

Create new distribution bucket. Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:create-bucket

OPTIONS
  -a, --acceptingBags=(yes|no)  [default: no] Whether the created bucket should accept new bags

  -c, --configPath=configPath   [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                                directory)

  -f, --familyId=familyId       (required) Distribution bucket family id

  -y, --yes                     Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/create-bucket.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/create-bucket.ts)_

## `joystream-distributor leader:create-bucket-family`

Create new distribution bucket family. Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:create-bucket-family

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/create-bucket-family.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/create-bucket-family.ts)_

## `joystream-distributor leader:delete-bucket`

Delete distribution bucket. The bucket must have no operators. Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:delete-bucket

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/delete-bucket.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/delete-bucket.ts)_

## `joystream-distributor leader:delete-bucket-family`

Delete distribution bucket family. Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:delete-bucket-family

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/delete-bucket-family.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/delete-bucket-family.ts)_

## `joystream-distributor leader:invite-bucket-operator`

Invite distribution bucket operator (distribution group worker).

```
USAGE
  $ joystream-distributor leader:invite-bucket-operator

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -w, --workerId=workerId      (required) ID of the distribution group worker to invite as bucket operator

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  The specified bucket must not have any operator currently.
     Requires distribution working group leader permissions.
```

_See code: [src/commands/leader/invite-bucket-operator.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/invite-bucket-operator.ts)_

## `joystream-distributor leader:set-buckets-per-bag-limit`

Set max. distribution buckets per bag limit. Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:set-buckets-per-bag-limit

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -l, --limit=limit            (required) New limit value

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/set-buckets-per-bag-limit.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/set-buckets-per-bag-limit.ts)_

## `joystream-distributor leader:update-bag`

Add/remove distribution buckets from a bag.

```
USAGE
  $ joystream-distributor leader:update-bag

OPTIONS
  -a, --add=add
      [default: ] ID of a bucket to add to bag

  -b, --bagId=bagId
      (required) Bag ID. Format: {bag_type}:{sub_type}:{id}.
           - Bag types: 'static', 'dynamic'
           - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
           - Id:
             - absent for 'static:council'
             - working group name for 'static:wg'
             - integer for 'dynamic:member' and 'dynamic:channel'
           Examples:
           - static:council
           - static:wg:storage
           - dynamic:member:4

  -c, --configPath=configPath
      [default: ./config.yml] Path to config JSON/YAML file (relative to current working directory)

  -f, --familyId=familyId
      (required) ID of the distribution bucket family

  -r, --remove=remove
      [default: ] ID of a bucket to remove from bag

  -y, --yes
      Answer "yes" to any prompt, skipping any manual confirmations

EXAMPLE
  $ joystream-distributor leader:update-bag -b 1 -f 1 -a 1 -a 2 -a 3 -r 4 -r 5
```

_See code: [src/commands/leader/update-bag.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-bag.ts)_

## `joystream-distributor leader:update-bucket-mode`

Update distribution bucket mode ("distributing" flag). Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:update-bucket-mode

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -d, --mode=(on|off)          (required) Whether the bucket should be "on" (distributing) or "off" (not distributing)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/update-bucket-mode.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-bucket-mode.ts)_

## `joystream-distributor leader:update-bucket-status`

Update distribution bucket status ("acceptingNewBags" flag). Requires distribution working group leader permissions.

```
USAGE
  $ joystream-distributor leader:update-bucket-status

OPTIONS
  -B, --bucketId=bucketId       (required) Distribution bucket id
  -a, --acceptingBags=(yes|no)  (required) Whether the bucket should accept new bags

  -c, --configPath=configPath   [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                                directory)

  -f, --familyId=familyId       (required) Distribution bucket family id

  -y, --yes                     Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/leader/update-bucket-status.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-bucket-status.ts)_

## `joystream-distributor leader:update-dynamic-bag-policy`

Update dynamic bag creation policy (number of buckets by family that should store given dynamic bag type).

```
USAGE
  $ joystream-distributor leader:update-dynamic-bag-policy

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -p, --policy=policy          Key-value pair of {familyId}:{numberOfBuckets}

  -t, --type=(Member|Channel)  (required) Dynamic bag type

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires distribution working group leader permissions.

EXAMPLE
  $ joystream-distributor leader:update-dynamic-bag-policy -t Member -p 1:5 -p 2:10 -p 3:5
```

_See code: [src/commands/leader/update-dynamic-bag-policy.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/leader/update-dynamic-bag-policy.ts)_

## `joystream-distributor operator:accept-invitation`

Accept pending distribution bucket operator invitation.

```
USAGE
  $ joystream-distributor operator:accept-invitation

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -f, --familyId=familyId      (required) Distribution bucket family id

  -w, --workerId=workerId      (required) ID of the invited operator (distribution group worker)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires the invited distribution group worker role key.
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/operator/accept-invitation.ts)_

## `joystream-distributor operator:set-metadata`

Set/update distribution bucket operator metadata.

```
USAGE
  $ joystream-distributor operator:set-metadata

OPTIONS
  -B, --bucketId=bucketId      (required) Distribution bucket id

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -e, --endpoint=endpoint      Root distribution node endpoint

  -f, --familyId=familyId      (required) Distribution bucket family id

  -i, --input=input            Path to JSON metadata file

  -w, --workerId=workerId      (required) ID of the invited operator (distribution group worker)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

DESCRIPTION
  Requires active distribution bucket operator worker role key.
```

_See code: [src/commands/operator/set-metadata.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/operator/set-metadata.ts)_

## `joystream-distributor start`

Start the node

```
USAGE
  $ joystream-distributor start

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/start.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/start.ts)_
<!-- commandsstop -->
