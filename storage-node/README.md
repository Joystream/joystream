# Colossus

Joystream storage node.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
![License](https://img.shields.io/github/license/Joystream/joystream)

<!-- toc -->
* [Colossus](#colossus)
* [Description](#description)
* [Installation](#installation)
* [Ubuntu Linux](#ubuntu-linux)
* [Install packages required for installation](#install-packages-required-for-installation)
* [Clone the code repository](#clone-the-code-repository)
* [Install volta](#install-volta)
* [Install project dependencies and build it](#install-project-dependencies-and-build-it)
* [Verify installation](#verify-installation)
* [Usage](#usage)
* [CLI Commands](#cli-commands)
<!-- tocstop -->

# Description

The main responsibility of Colossus is handling media data for users. The data could be images, audio, or video files.
Colossus receives uploads and saves files in the local folder, registers uploads in the blockchain, and later serves files
to Argus nodes (distribution nodes). Colossus instances spread the data using peer-to-peer synchronization.
Data management is blockchain-based, it relies on the concepts of buckets, bags, data objects.
The full description of the blockchain smart contracts could be found [here](https://github.com/Joystream/joystream/issues/2224).

### API

Colossus provides REST API for its clients and other Colossus instances. It's based on the OpenAPI Specification v3. Here is the complete [spec](./src/api-spec/openapi.yaml) (work in progress).

API endpoints:

- files
  - get - get the data file by its ID
  - head - get the data file headers by its ID
  - post - upload a file
- state
  - version - Colossus version and system environment
  - all data objects IDs
  - data objects IDs for bag
  - data statistics - total data folder size and data object number

### CLI

There is a command-line interface to manage Storage Working Group operations like create a bucket or change storage settings. Full description could be found [below](#cli-commands).

There are several groups of command:

- _leader_ - manages the Storage Working group in the blockchain. Requires leader privileges.
- _operator_ - Storage Provider group - it manages data object uploads and storage provider metadata(endpoint is the most important). Requires active Storage Working group membership.
- _dev_ - development support commands. Requires development blockchain setup with Alice account.
- _ungroupped_ - server and help commands. `server` starts Colossus and `help` shows the full command list.

### Metadata

The storage provider should provide _metadata_ for Colossus instance to be discoverable by other Colossus or
Argus (distributor node) instances. At the very least an endpoint should be registered in the blockchain.
For some complex scenarios, Colossus should provide its geolocation.

Metadata could be registered using [operator:set-metadata](#storage-node-operatorset-metadata) command.
A simple endpoint could be set using the `--endpoint` flag of the command. Complex metadata requires JSON file ([example](./scripts/operatorMetadata.json)).
JSON file format based on the _protobuf_ format described [here](../metadata-protobuf/proto/Storage.proto).

### Data

#### Uploading

Colossus accepts files using its API. The data must be uploaded using POST http method with `multipart/form-data`.
Simplified process (file uploading):

- accepting the data upload in the temp folder
- data hash & size verification
- moving the data to the data folder
- registering the data object as `accepted` in the blockchain

#### Synchronization

Several instances of Colossus should contain the data replica in order to provide some degree of reliability.
When some Colossus instance receives the data upload it marks the related data object as `accepted`.
Other instances that have the same obligations to store the data (they serve storage buckets assigned to the same bag)
will eventually load this data object from the initial receiver (or some other node that already downloaded a new
data object from the initial receiver) using REST API.

#### Distribution

The actual data distribution (serving to end-users) is done via Argus - the distributor node. It gets data from Colossus using the same `get` endpoint on a single data object basis.

### Comments

- Colossus relies on the [Query Node (Hydra)](https://www.joystream.org/hydra/) to get the blockchain data in a structured form.
- Using Colossus as a functioning Storage Provider requires providing [account URI or key file and password](https://wiki.polkadot.network/docs/learn-accounts) of a transactor account associated with the assigned storage bucket, as well as active `WorkerId` from the Storage Working group.

# Installation

```shell
# Ubuntu Linux

# Install packages required for installation
apt update
apt install git curl

# Clone the code repository
git clone https://github.com/Joystream/joystream
cd joystream

# Install volta
curl https://get.volta.sh | bash
bash

# Install project dependencies and build it
yarn
yarn workspace @joystream/types build
yarn workspace @joystream/metadata-protobuf build
yarn workspace storage-node build

# Verify installation
cd storage-node
yarn storage-node version
```

# Usage

```sh-session
$ yarn storage-node server --apiUrl ws://localhost:9944  -w 0 --accountUri //Alice -q localhost:4352 -o 3333 -d ~/uploads --sync
```

### Prerequisites

- accountURI or keyfile and password of the transactor account
- workerId from the Storage working group that matches with the transactor account above
- Joystream node websocket endpoint URL
- QueryNode URL
- (optional) ElasticSearch URL
- created directory for data uploading

### CLI command

Full command description could be find [below](#storage-node-server).

### Docker

There is also an option to run Colossus as [Docker container](../colossus.Dockerfile).

# CLI Commands

<!-- commands -->
* [`storage-node archive`](#storage-node-archive)
* [`storage-node help [COMMAND]`](#storage-node-help-command)
* [`storage-node leader:cancel-invite`](#storage-node-leadercancel-invite)
* [`storage-node leader:create-bucket`](#storage-node-leadercreate-bucket)
* [`storage-node leader:delete-bucket`](#storage-node-leaderdelete-bucket)
* [`storage-node leader:invite-operator`](#storage-node-leaderinvite-operator)
* [`storage-node leader:remove-operator`](#storage-node-leaderremove-operator)
* [`storage-node leader:set-bucket-limits`](#storage-node-leaderset-bucket-limits)
* [`storage-node leader:set-global-uploading-status`](#storage-node-leaderset-global-uploading-status)
* [`storage-node leader:set-replication`](#storage-node-leaderset-replication)
* [`storage-node leader:update-bag-limit`](#storage-node-leaderupdate-bag-limit)
* [`storage-node leader:update-bags`](#storage-node-leaderupdate-bags)
* [`storage-node leader:update-blacklist`](#storage-node-leaderupdate-blacklist)
* [`storage-node leader:update-bucket-status`](#storage-node-leaderupdate-bucket-status)
* [`storage-node leader:update-data-fee`](#storage-node-leaderupdate-data-fee)
* [`storage-node leader:update-data-object-bloat-bond`](#storage-node-leaderupdate-data-object-bloat-bond)
* [`storage-node leader:update-dynamic-bag-policy`](#storage-node-leaderupdate-dynamic-bag-policy)
* [`storage-node leader:update-voucher-limits`](#storage-node-leaderupdate-voucher-limits)
* [`storage-node operator:accept-invitation`](#storage-node-operatoraccept-invitation)
* [`storage-node operator:set-metadata`](#storage-node-operatorset-metadata)
* [`storage-node server`](#storage-node-server)
* [`storage-node util:cleanup`](#storage-node-utilcleanup)
* [`storage-node util:fetch-bucket`](#storage-node-utilfetch-bucket)
* [`storage-node util:multihash`](#storage-node-utilmultihash)
* [`storage-node util:search-archives`](#storage-node-utilsearch-archives)
* [`storage-node util:verify-bag-id`](#storage-node-utilverify-bag-id)

## `storage-node archive`

Starts running in a write-only, archive mode (no external API exposed). Downloads, compresses and uploads all assigned data objects to a specified S3 bucket.

```
USAGE
  $ storage-node archive

OPTIONS
  -e, --elasticSearchEndpoint=elasticSearchEndpoint
      Elasticsearch endpoint (e.g.: http://some.com:8081).
      Log level could be set using the ELASTIC_LOG_LEVEL environment variable.
      Supported values: warn, error, debug, info. Default:debug

  -h, --help
      show CLI help

  -i, --syncInterval=syncInterval
      [default: 20] Interval between synchronizations (in minutes)

  -k, --keyFile=keyFile
      Path to key file to add to the keyring.

  -l, --logFilePath=logFilePath
      Absolute path to the rolling log files.

  -m, --dev
      Use development mode

  -n, --logMaxFileNumber=logMaxFileNumber
      [default: 7] Maximum rolling log files number.

  -p, --password=password
      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files. If not specified a single
      password can be set in ACCOUNT_PWD environment variable.

  -q, --storageSquidEndpoint=storageSquidEndpoint
      (required) [default: http://localhost:4352/graphql] Storage Squid graphql server endpoint (e.g.:
      http://some.com:4352/graphql)

  -r, --syncWorkersNumber=syncWorkersNumber
      [default: 8] Sync workers number (max async operations in progress).

  -t, --syncWorkersTimeout=syncWorkersTimeout
      [default: 30] Asset downloading timeout for the syncronization (in minutes).

  -u, --apiUrl=apiUrl
      [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -w, --worker=worker
      (required) Storage provider worker ID

  -x, --logMaxFileSize=logMaxFileSize
      [default: 50000000] Maximum rolling log files size in bytes.

  -y, --accountUri=accountUri
      Account URI (optional). If not specified a single key can be set in ACCOUNT_URI environment variable.

  -z, --logFileChangeFrequency=(yearly|monthly|daily|hourly|none)
      [default: daily] Log files update frequency.

  --archiveFileSizeLimitMB=archiveFileSizeLimitMB
      [default: 1000] Try to avoid creating archive files larger than this size limit (in MB) unless unaviodable.

  --archiveTrackfileBackupFreqMinutes=archiveTrackfileBackupFreqMinutes
      [default: 60] Specifies how frequently the archive tracking file (containing information about archive files
      content) should be uploaded to S3 (in case it's changed).

  --awsS3BucketName=awsS3BucketName
      (required) Name of the AWS S3 bucket where the files will be stored.

  --awsS3BucketRegion=awsS3BucketRegion
      (required) AWS region of the AWS S3 bucket where the files will be stored.

  --awsStorageClass=(DEEP_ARCHIVE|EXPRESS_ONEZONE|GLACIER|GLACIER_IR|INTELLIGENT_TIERING|ONEZONE_IA|OUTPOSTS|REDUCED_RED
  UNDANCY|SNOW|STANDARD|STANDARD_IA)
      (required) [default: DEEP_ARCHIVE] AWS S3 storage class to use when uploading the archives to S3.

  --compressionAlgorithm=(7zip|zstd|none)
      (required) [default: zstd] Compression algorithm to use for archive files

  --compressionLevel=(low|medium|high)
      (required) [default: medium] Compression level to use for archive files (lower is faster, but provides lower storage
      savings)

  --compressionThreads=compressionThreads
      (required) [default: 1] Number of threads to use for compression. Note that {uploadWorkersNumber} upload tasks may
      be running at once and each of them can spawn a separate compression task which uses {compressionThreads} threads!

  --elasticSearchIndexPrefix=elasticSearchIndexPrefix
      [default: logs-colossus] Elasticsearch index prefix. Node ID will be appended to the prefix. Default: logs-colossus.
      Can be passed through ELASTIC_INDEX_PREFIX environment variable.

  --elasticSearchPassword=elasticSearchPassword
      Elasticsearch password for basic authentication. Can be passed through ELASTIC_PASSWORD environment variable.

  --elasticSearchUser=elasticSearchUser
      Elasticsearch user for basic authentication. Can be passed through ELASTIC_USER environment variable.

  --keyStore=keyStore
      Path to a folder with multiple key files to load into keystore.

  --localAgeTriggerThresholdMinutes=localAgeTriggerThresholdMinutes
      [default: 1440] Compress and upload all local data objects to S3 if the oldest of them was downloaded more than X
      minutes ago

  --localCountTriggerThreshold=localCountTriggerThreshold
      Compress and upload all local data objects to S3 if the number of them reaches this threshold.

  --localSizeTriggerThresholdMB=localSizeTriggerThresholdMB
      [default: 10000] Compress and upload all local data objects to S3 if the combined size of them reaches this
      threshold (in MB)

  --statsLoggingInterval=statsLoggingInterval
      (required) [default: 60] How often the upload/download/compression statistics summary will be logged (in minutes).

  --tmpDownloadDir=tmpDownloadDir
      (required) Directory to store temporary data (downloads in progress) during sync (absolute path).

  --uploadQueueDir=uploadQueueDir
      (required) Directory to store fully downloaded data objects before compressing them and uploading to S3 (absolute
      path).

  --uploadQueueDirSizeLimitMB=uploadQueueDirSizeLimitMB
      (required) [default: 20000] Limits the total size of files stored in upload queue directory (in MB). Download of the
      new objects may be slowed down in order to try to prevent exceeding this limit. WARNING: To leave a safe margin of
      error (for compression etc.), it should be set to ~50% of available disk space.

  --uploadWorkersNumber=uploadWorkersNumber
      [default: 4] Upload workers number (max async operations in progress).
```

_See code: [src/commands/archive.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/archive.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `storage-node leader:cancel-invite`

Cancel a storage bucket operator invite. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:cancel-invite

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/cancel-invite.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/cancel-invite.ts)_

## `storage-node leader:create-bucket`

Create new storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:create-bucket

OPTIONS
  -a, --allow                  Accepts new bags
  -h, --help                   show CLI help
  -i, --invited=invited        Invited storage operator ID (storage WG worker ID)
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode
  -n, --number=number          Storage bucket max total objects number

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -s, --size=size              Storage bucket max total objects size

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/create-bucket.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/create-bucket.ts)_

## `storage-node leader:delete-bucket`

Delete a storage bucket. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:delete-bucket

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/delete-bucket.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/delete-bucket.ts)_

## `storage-node leader:invite-operator`

Invite a storage bucket operator. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:invite-operator

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -w, --operatorId=operatorId  (required) Storage bucket operator ID (storage group worker ID)

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/invite-operator.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/invite-operator.ts)_

## `storage-node leader:remove-operator`

Remove a storage bucket operator. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:remove-operator

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/remove-operator.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/remove-operator.ts)_

## `storage-node leader:set-bucket-limits`

Set VoucherObjectsSizeLimit and VoucherObjectsNumberLimit for the storage bucket.

```
USAGE
  $ storage-node leader:set-bucket-limits

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode
  -o, --objects=objects        (required) New 'voucher object number limit' value

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -s, --size=size              (required) New 'voucher object size limit' value

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/set-bucket-limits.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/set-bucket-limits.ts)_

## `storage-node leader:set-global-uploading-status`

Set global uploading block. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:set-global-uploading-status

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -s, --set=(on|off)           (required) Sets global uploading block (on/off).

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/set-global-uploading-status.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/set-global-uploading-status.ts)_

## `storage-node leader:set-replication`

Adjusts bag-to-bucket assignments to achieve a given replication rate.

```
USAGE
  $ storage-node leader:set-replication

OPTIONS
  -a, --activeOnly             Only take active buckets into account when calculating replication rate and updating bags
  -b, --batchSize=batchSize    [default: 100] Number of extrinsics to send in a single utility.batch call
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode
  -o, --output=output          Output result to a file (based on the provided path) instead of stdout

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -r, --rate=rate              (required) The target replication rate

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --dryRun                     Assumes all transactions were successful and generates the summary

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.

  --skipBucketsSummary         Whether to skip a summary of changes by each individual bucket in the final result

  --skipConfirmation           Skips asking for confirmation before sending transactions

  --skipTxSummary              Whether to skip a summary of changes by each individual batch transaction in the final
                               result
```

_See code: [src/commands/leader/set-replication.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/set-replication.ts)_

## `storage-node leader:update-bag-limit`

Update StorageBucketsPerBagLimit variable in the Joystream node storage.

```
USAGE
  $ storage-node leader:update-bag-limit

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -l, --limit=limit            (required) New StorageBucketsPerBagLimit value
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-bag-limit.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-bag-limit.ts)_

## `storage-node leader:update-bags`

Add/remove a storage bucket/s from a bag/s. If multiple bags are provided, then the same input bucket ID/s would be added/removed from all bags.

```
USAGE
  $ storage-node leader:update-bags

OPTIONS
  -a, --add=add
      [default: ] Comma separated list of bucket IDs to add to all bag/s

  -h, --help
      show CLI help

  -i, --bagIds=bagIds
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
      Path to key file to add to the keyring.

  -m, --dev
      Use development mode

  -p, --password=password
      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files. If not specified a single
      password can be set in ACCOUNT_PWD environment variable.

  -r, --remove=remove
      [default: ] Comma separated list of bucket IDs to remove from all bag/s

  -s, --updateStrategy=(atomic|force)
      [default: atomic] Update strategy to use. Either "atomic" or "force".

  -u, --apiUrl=apiUrl
      [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri
      Account URI (optional). If not specified a single key can be set in ACCOUNT_URI environment variable.

  --keyStore=keyStore
      Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-bags.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-bags.ts)_

## `storage-node leader:update-blacklist`

Add/remove a content ID from the blacklist (adds by default).

```
USAGE
  $ storage-node leader:update-blacklist

OPTIONS
  -a, --add=add                [default: ] Content ID to add
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -r, --remove=remove          [default: ] Content ID to remove

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-blacklist.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-blacklist.ts)_

## `storage-node leader:update-bucket-status`

Update storage bucket status (accepting new bags).

```
USAGE
  $ storage-node leader:update-bucket-status

OPTIONS
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -s, --set=(on|off)           (required) Sets 'accepting new bags' parameter for the bucket (on/off).

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-bucket-status.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-bucket-status.ts)_

## `storage-node leader:update-data-fee`

Update data size fee. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:update-data-fee

OPTIONS
  -f, --fee=fee                (required) New data size fee
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-data-fee.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-data-fee.ts)_

## `storage-node leader:update-data-object-bloat-bond`

Update data object bloat bond value. Requires storage working group leader permissions.

```
USAGE
  $ storage-node leader:update-data-object-bloat-bond

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -v, --value=value            (required) New data object bloat bond value

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-data-object-bloat-bond.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-data-object-bloat-bond.ts)_

## `storage-node leader:update-dynamic-bag-policy`

Update number of storage buckets used in the dynamic bag creation policy.

```
USAGE
  $ storage-node leader:update-dynamic-bag-policy

OPTIONS
  -h, --help                      show CLI help
  -k, --keyFile=keyFile           Path to key file to add to the keyring.
  -m, --dev                       Use development mode
  -n, --number=number             (required) New storage buckets number

  -p, --password=password         Password to unlock keyfiles. Multiple passwords can be passed, to try against all
                                  files. If not specified a single password can be set in ACCOUNT_PWD environment
                                  variable.

  -t, --bagType=(Channel|Member)  (required) Dynamic bag type (Channel, Member).

  -u, --apiUrl=apiUrl             [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri     Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                                  environment variable.

  --keyStore=keyStore             Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-dynamic-bag-policy.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-dynamic-bag-policy.ts)_

## `storage-node leader:update-voucher-limits`

Update VoucherMaxObjectsSizeLimit and VoucherMaxObjectsNumberLimit for the Joystream node storage.

```
USAGE
  $ storage-node leader:update-voucher-limits

OPTIONS
  -h, --help                   show CLI help
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode
  -o, --objects=objects        (required) New 'max voucher object number limit' value

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -s, --size=size              (required) New 'max voucher object size limit' value

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/leader/update-voucher-limits.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/leader/update-voucher-limits.ts)_

## `storage-node operator:accept-invitation`

Accept pending storage bucket invitation.

```
USAGE
  $ storage-node operator:accept-invitation

OPTIONS
  -h, --help                                     show CLI help
  -i, --bucketId=bucketId                        (required) Storage bucket ID
  -k, --keyFile=keyFile                          Path to key file to add to the keyring.
  -m, --dev                                      Use development mode

  -p, --password=password                        Password to unlock keyfiles. Multiple passwords can be passed, to try
                                                 against all files. If not specified a single password can be set in
                                                 ACCOUNT_PWD environment variable.

  -t, --transactorAccountId=transactorAccountId  (required) Transactor account ID (public key)

  -u, --apiUrl=apiUrl                            [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev
                                                 environment.

  -w, --workerId=workerId                        (required) Storage operator worker ID

  -y, --accountUri=accountUri                    Account URI (optional). If not specified a single key can be set in
                                                 ACCOUNT_URI environment variable.

  --keyStore=keyStore                            Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/operator/accept-invitation.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/operator/accept-invitation.ts)_

## `storage-node operator:set-metadata`

Set metadata for the storage bucket.

```
USAGE
  $ storage-node operator:set-metadata

OPTIONS
  -e, --endpoint=endpoint      Root distribution node endpoint
  -h, --help                   show CLI help
  -i, --bucketId=bucketId      (required) Storage bucket ID
  -j, --jsonFile=jsonFile      Path to JSON metadata file
  -k, --keyFile=keyFile        Path to key file to add to the keyring.
  -m, --dev                    Use development mode

  -p, --password=password      Password to unlock keyfiles. Multiple passwords can be passed, to try against all files.
                               If not specified a single password can be set in ACCOUNT_PWD environment variable.

  -u, --apiUrl=apiUrl          [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev environment.

  -w, --workerId=workerId      (required) Storage operator worker ID

  -y, --accountUri=accountUri  Account URI (optional). If not specified a single key can be set in ACCOUNT_URI
                               environment variable.

  --keyStore=keyStore          Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/operator/set-metadata.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/operator/set-metadata.ts)_

## `storage-node server`

Starts the storage node server.

```
USAGE
  $ storage-node server

OPTIONS
  -b, --buckets=buckets                                            [default: ] Comma separated list of bucket IDs to
                                                                   service. Buckets that are not assigned to worker are
                                                                   ignored. If not specified all buckets will be
                                                                   serviced.

  -c, --cleanup                                                    Enable cleanup/pruning of no-longer assigned assets.

  -d, --uploads=uploads                                            (required) Data uploading directory (absolute path).

  -e, --elasticSearchEndpoint=elasticSearchEndpoint                Elasticsearch endpoint (e.g.: http://some.com:8081).
                                                                   Log level could be set using the ELASTIC_LOG_LEVEL
                                                                   environment variable.
                                                                   Supported values: warn, error, debug, info.
                                                                   Default:debug

  -h, --help                                                       show CLI help

  -i, --cleanupInterval=cleanupInterval                            [default: 360] Interval between periodic cleanup
                                                                   actions (in minutes)

  -i, --syncInterval=syncInterval                                  [default: 20] Interval between synchronizations (in
                                                                   minutes)

  -k, --keyFile=keyFile                                            Path to key file to add to the keyring.

  -l, --logFilePath=logFilePath                                    Absolute path to the rolling log files.

  -m, --dev                                                        Use development mode

  -n, --logMaxFileNumber=logMaxFileNumber                          [default: 7] Maximum rolling log files number.

  -o, --port=port                                                  (required) Server port.

  -p, --password=password                                          Password to unlock keyfiles. Multiple passwords can
                                                                   be passed, to try against all files. If not specified
                                                                   a single password can be set in ACCOUNT_PWD
                                                                   environment variable.

  -q, --storageSquidEndpoint=storageSquidEndpoint                  (required) [default: http://localhost:4352/graphql]
                                                                   Storage Squid graphql server endpoint (e.g.:
                                                                   http://some.com:4352/graphql)

  -r, --syncWorkersNumber=syncWorkersNumber                        [default: 20] Sync workers number (max async
                                                                   operations in progress).

  -s, --sync                                                       Enable data synchronization.

  -t, --syncWorkersTimeout=syncWorkersTimeout                      [default: 30] Asset downloading timeout for the
                                                                   syncronization (in minutes).

  -u, --apiUrl=apiUrl                                              [default: ws://localhost:9944] Runtime API URL.
                                                                   Mandatory in non-dev environment.

  -w, --worker=worker                                              (required) Storage provider worker ID

  -x, --logMaxFileSize=logMaxFileSize                              [default: 50000000] Maximum rolling log files size in
                                                                   bytes.

  -y, --accountUri=accountUri                                      Account URI (optional). If not specified a single key
                                                                   can be set in ACCOUNT_URI environment variable.

  -z, --logFileChangeFrequency=(yearly|monthly|daily|hourly|none)  [default: daily] Log files update frequency.

  --cleanupBatchSize=cleanupBatchSize                              [default: 10000] Maximum number of objects to process
                                                                   in a single batch during cleanup.

  --cleanupWorkersNumber=cleanupWorkersNumber                      [default: 100] Cleanup workers number (max async
                                                                   operations in progress).

  --elasticSearchIndexPrefix=elasticSearchIndexPrefix              Elasticsearch index prefix. Node ID will be appended
                                                                   to the prefix. Default: logs-colossus. Can be passed
                                                                   through ELASTIC_INDEX_PREFIX environment variable.

  --elasticSearchPassword=elasticSearchPassword                    Elasticsearch password for basic authentication. Can
                                                                   be passed through ELASTIC_PASSWORD environment
                                                                   variable.

  --elasticSearchUser=elasticSearchUser                            Elasticsearch user for basic authentication. Can be
                                                                   passed through ELASTIC_USER environment variable.

  --keyStore=keyStore                                              Path to a folder with multiple key files to load into
                                                                   keystore.

  --maxBatchTxSize=maxBatchTxSize                                  [default: 20] Maximum number of
                                                                   `accept_pending_data_objects` in a batch
                                                                   transactions.

  --pendingFolder=pendingFolder                                    Directory to store pending files which are being
                                                                   uploaded (absolute path).
                                                                   If not specified a subfolder under the uploads
                                                                   directory will be used.

  --syncBatchSize=syncBatchSize                                    [default: 10000] Maximum number of objects to process
                                                                   in a single batch during synchronization.

  --syncRetryInterval=syncRetryInterval                            [default: 3] Interval before retrying failed
                                                                   synchronization run (in minutes)

  --tempFolder=tempFolder                                          Directory to store tempory files during sync
                                                                   (absolute path).
                                                                   If not specified a subfolder under the uploads
                                                                   directory will be used.
```

_See code: [src/commands/server.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/server.ts)_

## `storage-node util:cleanup`

Runs the data objects cleanup/pruning workflow. It removes all the local stored data objects that the operator is no longer obliged to store

```
USAGE
  $ storage-node util:cleanup

OPTIONS
  -b, --bucketId=bucketId                          (required) The buckerId to sync prune/cleanup
  -d, --uploads=uploads                            (required) Data uploading directory (absolute path).
  -h, --help                                       show CLI help
  -k, --keyFile=keyFile                            Path to key file to add to the keyring.
  -m, --dev                                        Use development mode

  -p, --cleanupWorkersNumber=cleanupWorkersNumber  [default: 20] Cleanup/Pruning workers number (max async operations in
                                                   progress).

  -p, --password=password                          Password to unlock keyfiles. Multiple passwords can be passed, to try
                                                   against all files. If not specified a single password can be set in
                                                   ACCOUNT_PWD environment variable.

  -q, --queryNodeEndpoint=queryNodeEndpoint        [default: http://localhost:4352/graphql] Storage Squid graphql server
                                                   endpoint (e.g.: http://some.com:4352/graphql)

  -u, --apiUrl=apiUrl                              [default: ws://localhost:9944] Runtime API URL. Mandatory in non-dev
                                                   environment.

  -w, --workerId=workerId                          (required) Storage node operator worker ID.

  -y, --accountUri=accountUri                      Account URI (optional). If not specified a single key can be set in
                                                   ACCOUNT_URI environment variable.

  --cleanupBatchSize=cleanupBatchSize              [default: 10000] Maximum number of objects to process in a single
                                                   batch during cleanup.

  --keyStore=keyStore                              Path to a folder with multiple key files to load into keystore.
```

_See code: [src/commands/util/cleanup.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/util/cleanup.ts)_

## `storage-node util:fetch-bucket`

Downloads all data objects of specified bucket, that matches worker ID obligations.

```
USAGE
  $ storage-node util:fetch-bucket

OPTIONS
  -b, --bucketId=bucketId                            (required) The buckerId to fetch
  -d, --uploads=uploads                              (required) Data uploading directory (absolute path).
  -h, --help                                         show CLI help

  -n, --syncWorkersNumber=syncWorkersNumber          [default: 20] Sync workers number (max async operations in
                                                     progress).

  -o, --dataSourceOperatorUrl=dataSourceOperatorUrl  Storage node url base (e.g.: http://some.com:3333) to get data
                                                     from.

  -q, --queryNodeEndpoint=queryNodeEndpoint          [default: http://localhost:4352/graphql] Storage Squid graphql
                                                     server endpoint (e.g.: http://some.com:4352/graphql)

  -t, --syncWorkersTimeout=syncWorkersTimeout        [default: 30] Asset downloading timeout for the syncronization (in
                                                     minutes).

  --syncBatchSize=syncBatchSize                      [default: 10000] Maximum number of objects to process in a single
                                                     batch.

  --tempFolder=tempFolder                            Directory to store tempory files during sync and upload (absolute
                                                     path).
                                                     ,Temporary directory (absolute path). If not specified a subfolder
                                                     under the uploads directory will be used.
```

_See code: [src/commands/util/fetch-bucket.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/util/fetch-bucket.ts)_

## `storage-node util:multihash`

Creates a multihash (blake3) for a file.

```
USAGE
  $ storage-node util:multihash

OPTIONS
  -f, --file=file  (required) Path for a hashing file.
  -h, --help       show CLI help
```

_See code: [src/commands/util/multihash.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/util/multihash.ts)_

## `storage-node util:search-archives`

Searches for the archive file names given an archive trackfile and a list of data objects of interest.

```
USAGE
  $ storage-node util:search-archives

OPTIONS
  -f, --archiveTrackfile=archiveTrackfile  (required) Path to the archive trackfile (jsonl)
  -j, --json                               Output as JSON
  -n, --nameOnly                           Output only the archive names
  -o, --dataObjects=dataObjects            (required) List of the data object ids to look for (comma-separated)
```

_See code: [src/commands/util/search-archives.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/util/search-archives.ts)_

## `storage-node util:verify-bag-id`

The command verifies bag id supported by the storage node. Requires chain connection.

```
USAGE
  $ storage-node util:verify-bag-id

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

_See code: [src/commands/util/verify-bag-id.ts](https://github.com/Joystream/joystream/blob/v4.5.0/src/commands/util/verify-bag-id.ts)_
<!-- commandsstop -->
