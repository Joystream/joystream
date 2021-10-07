Colossus v2
===============

Joystream storage subsystem.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
![License](https://img.shields.io/github/license/Joystream/joystream)

<!-- toc -->
* [Description](#description)
* [Installation](#installation)
* [Usage](#usage)
* [CLI Commands](#cli-commands)
<!-- tocstop -->

# Description

The main responsibility of Colossus is handling media data for users. The data could be images, audio or video files.
Colossus receives uploads and saves files in the local folder, registers uploads in the blockchain and later serves files 
to Argus nodes (distribution nodes). Colossus instances spread the data using peer-to-peer synchronization.
On data uploading clients should provide authentication token to prevent abuse.
Data management is blockchain-based, it relies on the concepts of buckets, bags, data objects.
The full description of the blockchain smart contracts could be found [here](https://github.com/Joystream/joystream/issues/2224).

#### API

Colossus provides REST API for its clients and other Colossus instances. It's based on the OpenAPI Specification v3. Here is the complete [spec](./src/api-spec/openapi.yaml) (work in progress).

API endpoints:
- files
    - get - get the data file by its ID
    - head - get the data file headers by its ID
    - post - upload a file (requires auth token)
    - auth_token - returns auth token for uploading
- state
    - version - Colossus version and system environment
    - all data objects IDs
    - data objects IDs for bag
    - data statistics - total data folder size and data object number


#### Auth schema description

To reduce possibility of abuse of the uploading endpoint we implemented simple authentication schema. On each uploading attempt the client should receive the auth token first and provided as a special header. The token has expiration time and cannot be reused. To receive such token the client should be part of the StorageWorkingGroup and have  `WorkerId`.


#### CLI

There is a command line interface to manage Storage Working Group operations like create bucket or change storage settings. Full description could be found [below](#cli-commands).

There are several groups of command:
- *leader* - manages the Storage Working group in the blockchain. Requires leader privileges.
- *operator* - Storage Provider group - it manages data object uploads and storage provider metadata(endpoint is the most important). Requires active Storage Working group membership.
- *dev* - development support commands. Requires development blockchain setup with Alice account.
- *ungroupped* - server and help commands. `server` starts Colossus and `help` shows the full command list.

#### Data synchronization

Several instances of Colossus should contain the data replica in order to provide some degree of reliability. When some Colossus instance receive the data upload it marks the related data object as `accepted`. Other instances that has the same obligations to store the data (they serve storage buckets assigned to the same bag) will eventually load this data object from the initial receiver (or some other node that already downloaded new data object from the initial receiver) using REST API.

#### Data distribution

The actual data distribution (serving to end users) is done via Argus - the distributor node. It gets data from Colossus using the same `get` endpoint on the single data object basis.

#### Data uploading

Colossus accepts files using its API. The data must be uploaded using POST http method with `multipart/form-data`.
Simplified process:

1. Get auth token using API endpoint
   - sign data object info with private blockchain account key

2. Upload file
   - auth header decoding and verification
   - accepting the data upload in temp folder
   - data hash & size verification
   - moving the data to data folder
   - registering the data object as `accepted` in the blockchain

#### Comments
- Colossus relies on the [Query Node (Hydra)](https://www.joystream.org/hydra/) to get the blockchain data in a structured form.
- Using Colossus as functioning Storage Provider requires providing [account URI or key file and password](https://wiki.polkadot.network/docs/learn-accounts) as well as active `WorkerId` from the Storage Working group.

# Installation
```shell
# Ubuntu Linux

# Install packages required for installation
apt update
apt install git curl

# Clone the code repository
git clone https://github.com/Joystream/joystream
cd joystream

# Change working branch! No need after the Giza release (merge with master)
git checkout giza

# Install volta
curl https://get.volta.sh | bash
bash

# Install project dependencies and build it
yarn
yarn workspace @joystream/types build
yarn workspace @joystream/metadata-protobuf build
yarn workspace storage-node-v2 build

# Verify installation
cd storage-node-v2
yarn storage-node version
```
# Usage
## Prerequisites
- accountURI or keyfile and password
- workerId from the Storage working group that matches with the account above
- Joystream Network validator URL
- QueryNode URL
- (optional) ElasticSearch URL
- created directory for data uploading

```sh-session
$ yarn storage-node server --apiUrl ws://localhost:9944  -w 0 --accountUri //Alice -q localhost:8081 -o 3333 -d ~/uploads --sync
```

There is also an option to run Colossus as [Docker container](../colossus.Dockerfile).

# CLI Commands
<!-- commands -->
* [`storage-node dev:init`](#storage-node-devinit)
* [`storage-node dev:multihash`](#storage-node-devmultihash)
* [`storage-node dev:sync`](#storage-node-devsync)
* [`storage-node dev:upload`](#storage-node-devupload)
* [`storage-node dev:verify-bag-id`](#storage-node-devverify-bag-id)
* [`storage-node help [COMMAND]`](#storage-node-help-command)
* [`storage-node leader:cancel-invite`](#storage-node-leadercancel-invite)
* [`storage-node leader:create-bucket`](#storage-node-leadercreate-bucket)
* [`storage-node leader:delete-bucket`](#storage-node-leaderdelete-bucket)
* [`storage-node leader:invite-operator`](#storage-node-leaderinvite-operator)
* [`storage-node leader:remove-operator`](#storage-node-leaderremove-operator)
* [`storage-node leader:set-bucket-limits`](#storage-node-leaderset-bucket-limits)
* [`storage-node leader:set-global-uploading-status`](#storage-node-leaderset-global-uploading-status)
* [`storage-node leader:update-bag`](#storage-node-leaderupdate-bag)
* [`storage-node leader:update-bag-limit`](#storage-node-leaderupdate-bag-limit)
* [`storage-node leader:update-blacklist`](#storage-node-leaderupdate-blacklist)
* [`storage-node leader:update-bucket-status`](#storage-node-leaderupdate-bucket-status)
* [`storage-node leader:update-data-fee`](#storage-node-leaderupdate-data-fee)
* [`storage-node leader:update-dynamic-bag-policy`](#storage-node-leaderupdate-dynamic-bag-policy)
* [`storage-node leader:update-voucher-limits`](#storage-node-leaderupdate-voucher-limits)
* [`storage-node operator:accept-invitation`](#storage-node-operatoraccept-invitation)
* [`storage-node operator:set-metadata`](#storage-node-operatorset-metadata)
* [`storage-node server`](#storage-node-server)

## `storage-node dev:init`

Initialize development environment. Sets Alice as storage working group leader.

```
USAGE
  $ storage-node dev:init

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/dev/init.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/dev/init.ts)_

## `storage-node dev:multihash`

Creates a multihash (blake3) for a file.

```
USAGE
  $ storage-node dev:multihash

OPTIONS
  -f, --file=file  (required) Path for a hashing file.
  -h, --help       show CLI help
```

_See code: [src/commands/dev/multihash.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/dev/multihash.ts)_

## `storage-node dev:sync`

Synchronizes the data - it fixes the differences between local data folder and worker ID obligations from the runtime.

```
USAGE
  $ storage-node dev:sync

OPTIONS
  -d, --uploads=uploads                                (required) Data uploading directory (absolute path).
  -h, --help                                           show CLI help

  -o, --dataSourceOperatorHost=dataSourceOperatorHost  Storage node host and port (e.g.: some.com:8081) to get data
                                                       from.

  -p, --syncWorkersNumber=syncWorkersNumber            Sync workers number (max async operations in progress).

  -q, --queryNodeHost=queryNodeHost                    Query node host and port (e.g.: some.com:8081)

  -w, --workerId=workerId                              (required) Storage node operator worker ID.
```

_See code: [src/commands/dev/sync.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/dev/sync.ts)_

## `storage-node dev:upload`

Upload data object (development mode only).

```
USAGE
  $ storage-node dev:upload

OPTIONS
  -c, --cid=cid                (required) Data object IPFS content ID.
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --size=size              (required) Data object size.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/dev/upload.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/dev/upload.ts)_

## `storage-node dev:verify-bag-id`

The command verifies bag id supported by the storage node. Requires chain connection.

```
USAGE
  $ storage-node dev:verify-bag-id

OPTIONS
  -h, --help
      show CLI help

  -i, --bagId=bagId
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
```

_See code: [src/commands/dev/verify-bag-id.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/dev/verify-bag-id.ts)_

## `storage-node help [COMMAND]`

display help for storage-node

```
USAGE
  $ storage-node help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `storage-node leader:cancel-invite`

Cancel a storage bucket operator invite. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:cancel-invite

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/cancel-invite.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/cancel-invite.ts)_

## `storage-node leader:create-bucket`

Create new storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:create-bucket

OPTIONS
  -a, --allow                  Accepts new bags
  -h, --help                   show CLI help
  -i, --invited=invited        Invited storage operator ID (storage WG worker ID)
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -n, --number=number          Storage bucket max total objects number
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --size=size              Storage bucket max total objects size
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/create-bucket.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/create-bucket.ts)_

## `storage-node leader:delete-bucket`

Delete a storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:delete-bucket

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/delete-bucket.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/delete-bucket.ts)_

## `storage-node leader:invite-operator`

Invite a storage bucket operator. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:invite-operator

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.
  -w, --operatorId=operatorId  (required) Storage bucket operator ID (storage group worker ID)

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/invite-operator.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/invite-operator.ts)_

## `storage-node leader:remove-operator`

Remove a storage bucket operator. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:remove-operator

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/remove-operator.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/remove-operator.ts)_

## `storage-node leader:set-bucket-limits`

Set VoucherObjectsSizeLimit and VoucherObjectsNumberLimit for the storage bucket.

```
USAGE
  $ storage-node leader:set-bucket-limits

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -o, --objects=objects        (required) New 'voucher object number limit' value
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --size=size              (required) New 'voucher object size limit' value
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/set-bucket-limits.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/set-bucket-limits.ts)_

## `storage-node leader:set-global-uploading-status`

Set global uploading block. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:set-global-uploading-status

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --set=(on|off)           (required) Sets global uploading block (on/off).
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/set-global-uploading-status.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/set-global-uploading-status.ts)_

## `storage-node leader:update-bag`

Add/remove a storage bucket from a bag (adds by default).

```
USAGE
  $ storage-node leader:update-bag

OPTIONS
  -a, --add=add
      [default: ] ID of a bucket to add to bag

  -h, --help
      show CLI help

  -i, --bagId=bagId
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

  -k, --keyFile=keyFile
      Key file for the account. Mandatory in non-dev environment.

  -m, --dev
      Use development mode

  -p, --password=password
      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.

  -r, --remove=remove
      [default: ] ID of a bucket to remove from bag

  -u, --apiUrl=apiUrl
      [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri
      Account URI (optional). Has a priority over the keyFile and password flags. Could be overriden by ACCOUNT_URI 
      environment variable.
```

_See code: [src/commands/leader/update-bag.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-bag.ts)_

## `storage-node leader:update-bag-limit`

Update StorageBucketsPerBagLimit variable in the Joystream node storage.

```
USAGE
  $ storage-node leader:update-bag-limit

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -l, --limit=limit            (required) New StorageBucketsPerBagLimit value
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-bag-limit.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-bag-limit.ts)_

## `storage-node leader:update-blacklist`

Add/remove a content ID from the blacklist (adds by default).

```
USAGE
  $ storage-node leader:update-blacklist

OPTIONS
  -a, --add=add                [default: ] Content ID to add
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -r, --remove=remove          [default: ] Content ID to remove
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-blacklist.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-blacklist.ts)_

## `storage-node leader:update-bucket-status`

Update storage bucket status (accepting new bags).

```
USAGE
  $ storage-node leader:update-bucket-status

OPTIONS
  -d, --disable                Disables accepting new bags.
  -e, --enable                 Enables accepting new bags (default).
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --set=(on|off)           (required) Sets 'accepting new bags' parameter for the bucket (on/off).
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-bucket-status.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-bucket-status.ts)_

## `storage-node leader:update-data-fee`

Update data size fee. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:update-data-fee

OPTIONS
  -f, --fee=fee                (required) New data size fee
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-data-fee.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-data-fee.ts)_

## `storage-node leader:update-dynamic-bag-policy`

Update number of storage buckets used in the dynamic bag creation policy.

```
USAGE
  $ storage-node leader:update-dynamic-bag-policy

OPTIONS
  -h, --help                      show CLI help
  -k, --keyFile=keyFile           Key file for the account. Mandatory in non-dev environment.
  -m, --dev                       Use development mode
  -n, --number=number             (required) New storage buckets number
  -p, --password=password         Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -t, --bagType=(Channel|Member)  (required) Dynamic bag type (Channel, Member).
  -u, --apiUrl=apiUrl             [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri     Account URI (optional). Has a priority over the keyFile and password flags. Could be
                                  overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-dynamic-bag-policy.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-dynamic-bag-policy.ts)_

## `storage-node leader:update-voucher-limits`

Update VoucherMaxObjectsSizeLimit and VoucherMaxObjectsNumberLimit for the Joystream node storage.

```
USAGE
  $ storage-node leader:update-voucher-limits

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -o, --objects=objects        (required) New 'max voucher object number limit' value
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -s, --size=size              (required) New 'max voucher object size limit' value
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/leader/update-voucher-limits.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/leader/update-voucher-limits.ts)_

## `storage-node operator:accept-invitation`

Accept pending storage bucket invitation.

```
USAGE
  $ storage-node operator:accept-invitation

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.
  -w, --workerId=workerId      (required) Storage operator worker ID

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/operator/accept-invitation.ts)_

## `storage-node operator:set-metadata`

Accept pending storage bucket invitation.

```
USAGE
  $ storage-node operator:set-metadata

OPTIONS
  -e, --endpoint=endpoint      Root distribution node endpoint
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -j, --jsonFile=jsonFile      Path to JSON metadata file
  -k, --keyFile=keyFile        Key file for the account. Mandatory in non-dev environment.
  -m, --dev                    Use development mode
  -p, --password=password      Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.
  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.
  -w, --operatorId=operatorId  (required) Storage bucket operator ID (storage group worker ID)

  -y, --accountUri=accountUri  Account URI (optional). Has a priority over the keyFile and password flags. Could be
                               overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/operator/set-metadata.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/operator/set-metadata.ts)_

## `storage-node server`

Starts the storage node server.

```
USAGE
  $ storage-node server

OPTIONS
  -a, --disableUploadAuth                    Disable uploading authentication (should be used in testing-context only).
  -d, --uploads=uploads                      (required) Data uploading directory (absolute path).

  -e, --elasticSearchHost=elasticSearchHost  Elasticsearch host and port (e.g.: some.com:8081).
                                             Log level could be set using the ELASTIC_LOG_LEVEL enviroment variable.
                                             Supported values: warn, error, debug, info. Default:debug

  -h, --help                                 show CLI help

  -i, --syncInterval=syncInterval            [default: 1] Interval between synchronizations (in minutes)

  -k, --keyFile=keyFile                      Key file for the account. Mandatory in non-dev environment.

  -m, --dev                                  Use development mode

  -o, --port=port                            (required) Server port.

  -p, --password=password                    Key file password (optional). Could be overriden by ACCOUNT_PWD environment
                                             variable.

  -q, --queryNodeHost=queryNodeHost          (required) Query node host and port (e.g.: some.com:8081)

  -r, --syncWorkersNumber=syncWorkersNumber  [default: 20] Sync workers number (max async operations in progress).

  -s, --sync                                 Enable data synchronization.

  -u, --apiUrl=apiUrl                        [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev
                                             environment.

  -w, --worker=worker                        (required) Storage provider worker ID

  -y, --accountUri=accountUri                Account URI (optional). Has a priority over the keyFile and password flags.
                                             Could be overriden by ACCOUNT_URI environment variable.
```

_See code: [src/commands/server.ts](https://github.com/Joystream/joystream/blob/v2.0.0/src/commands/server.ts)_

<!-- commandsstop -->
