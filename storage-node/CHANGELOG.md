### 4.5.0

- Added `leader:set-replication` command which allows adjusting bag-to-bucket assignments in order to achieve a given replication rate. It also supports generating detailed summaries of changes required to make that adjustment.
- Added a possibility to set `CLEANUP` and `CLEANUP_INTERVAL` via env in the `server` command.
- Added a few new utility functions (`stringifyBagId`, `cmpBagId`, `isEvent`, `asStorageSize`, `getBatchResults`).
- Updated `updateStorageBucketsForBags` to rely on the new `getBatchResults` utility function.

### 4.4.0

- **Optimizations:** The way data objects / data object ids are queried and processed during sync and cleanup has been optimized:
  - Sync and cleanup services now process tasks in batches of configurable size (`--syncBatchSize`, `--cleanupBatchSize`) to avoid overflowing the memory.
  - Synchronous operations like `sort` or `filter` on larger arrays of data objects have been optimized (for example, by replacing `.filter(Array.includes(...))` with `.filter(Set.has(...))`).
  - Enforced a limit of max. results per single GraphQL query to `10,000` and max input arguments per query to `1,000`.
  - Added `--cleanupWorkersNumber` flag to limit the number of concurrent async requests during cleanup.
- A safety mechanism was added to avoid removing "deleted" objects for which a related `DataObjectDeleted` event cannot be found in storage squid.
- Improved logging during sync and cleanup.

### 4.3.0

- Adds `archive` mode / command, which allows downloading, compressing and uploading all data objects to an external S3 bucket that can be used as a backup.

### 4.2.0

- Fix `util:cleanup` script (call `loadDataObjectIdCache` first)
- Allow changing default log level using environment variable (`COLOSSUS_DEFAULT_LOG_LEVEL`)
- Allow adjusting cleanup constants via env (`CLEANUP_MIN_REPLICATION_THRESHOLD`, `CLEANUP_NEW_OBJECT_EXPIRATION_PERIOD`)
- Error handling: Clearer warning messages if unexpected response encountered during sync (ie. 404)

### 4.1.2

- Bump @joystream/types to Petra version

### 4.1.1

- Bump deps @polkadot/api v10.7.1

### 4.1.0

- Nara release.

### 4.0.1

- Set the `server.requestTimeout` option in `http.Server` instance to 0 to disable the timeout. This was default behaviour pre Node.js `18.x`

### 4.0.0

- Replaced `Query-Node` API with `Storage-Squid` Graphql API. This is a breaking change and requires the `--queryNodeEndpoint` configuration option to be replaced with `--storageSquidEndpoint`.

### 3.10.2

- Fix processing large arrays causing high cpu during sync and cleanup runs [#5033](https://github.com/Joystream/joystream/pull/5033)

- Fix task runner to avoid ending prematurely on individual task failure [#5033](https://github.com/Joystream/joystream/pull/5033)

### 3.10.1

- Bug fix: call stack size exceeded error - [#5021](https://github.com/Joystream/joystream/pull/5021)
- Bug fix: moveFile instead of rename to support moving files across volumes [#5024](https://github.com/Joystream/joystream/pull/5024)

### 3.10.0

- **FIX** unhandled `error` events on superagent. [#4988](https://github.com/Joystream/joystream/pull/4998),[#5007](https://github.com/Joystream/joystream/pull/5007)
- General improvements when setting up uploads and temp folder. Ensure local data objects cache is not polluted by other than object id file names.
- Added constraint on temp, pending, logs, and uploads folder needing to be at different paths, and added two new optional `--tempFolder` and `--pendingFolder` arguments to specify full path to these folders. This is in preparation for future releases where we will be moving to use different storage backends. [#5000](https://github.com/Joystream/joystream/pull/5000)
- Improve operator url selection and avoid connecting to self. [#4993](https://github.com/Joystream/joystream/pull/4993)
- Various bug fixes that were introduced in v3.9.0 in accept pending objects service. [#5016](https://github.com/Joystream/joystream/pull/5016)
- Syncing worker improvement, no longer relying on `/api/v1/state/data-objects` endpoint to determine which hosts to sync from. [#5014](https://github.com/Joystream/joystream/pull/5014)

### 3.9.1

- **FIX**: Added event handler to handle `error` event on `superagent.get` instance. Previously the unhandled error was causing the application to crash.

### 3.9.0

- Increase default interval between sync runs. Start sync run immediately do not wait initial interval on startup before starting sync. Adds additional optional argument to specify retry interval on failure. [#4924](https://github.com/Joystream/joystream/pull/4924)
- Add background pruning worker to delete data objects which the node is no longer obligated to store. New optional argument `--cleanup` and `--cleanupInterval`
- Added new `AcceptPendingObjectsService` that is responsible for periodically sending batch `accept_pending_data_objects` for all the pending data objects. The `POST /files` endpoint now no longer calls the `accept_pending_data_objects` extrinsic for individual uploads, instead, it registers all the pending objects with `AcceptPendingObjectsService`
- Updated `/state/data` endpoint response headers to return data objects status too i.e. (`pending` or `accepted`)
- **FIX**: Increase the default timeout value in the `extrinsicWrapper` function to match the transaction validity in the transaction pool

### 3.8.1

- Hotfix: Fix call stack size exceeded when handling large number of initial object to sync.

### 3.8.0

- Changed Elasticsearch transport to use data streams instead of regular indices. Removed `--elasticSearchIndex` option and replaced with `--elasticSearchIndexPrefix`. Node ID from config will be automatically appended to the index name.

### 3.7.2

- Bumped `winston-elasticsearch` package verion
- **FIX**: Added error handler to caught exception in `ElasticsearchTransport` and gracefully log them

### 3.7.1

- Disable open-api express response validation if NODE_ENV == 'production'. This should improve response times when serving assets. [#4810](https://github.com/Joystream/joystream/pull/4810)
- Include `nodeEnv` in `/api/v1/status` response, to help detect mis-configured nodes.

### 3.7.0

- Updates `leader:update-bag` CLI command to `leader:update-bags` to accept multiple bag ids as input. This allows the command to be used to update storage buckets of multiple bags in a single batched transaction.

### 3.6.0

- Collosus can now store multiple keys in it's keyring.
- The `--accountUri` and `--password` args can be used multiple times to add multiple keys. This adds support for worker to use different transactor accounts for each bucket.
- Added `--keyStore` argument for all commands to configure a directory containing multiple key files to the keyring.
- Server can run and to serve specific buckets, by passing a comma separated list of bucket ids with the `--buckets` argument.
- Renamed `--operatorId` argument to `--workerId` in operator commands for consistency.

### 3.5.1

- **FIX** `sendExtrinsic`: The send extrinsic function (which is a wrapper around PolkadotJS `tx.signAndSend` function) has been fixed to handle the case when tx has been finalized before the callback registered in `tx.signAndSend` would run.

### 3.5.0

- Integrates OpenTelemetry API/SDK with Colossus for exporting improved tracing logs & metrics to Elasticsearch. Adds `./start-elasticsearch-stack.sh` script to bootstrap elasticsearch services (Elasticsearch + Kibana + APM Server) with all the required configurations.

### 3.4.0

- Added option 'none' to 'logFileChangeFrequency' argument. The default is still 'daily'. 'none' prevents log rotaion on time basis and only rotates when max size for logs files is reached.

### 3.3.0

- Added customization options for Elasticsearch logging. Users can now specify index name and auth options.
- **FIX** [#4773](https://github.com/Joystream/joystream/issues/4773) Cleanup temporary files created when upload fails.

### 3.2.0

- Updated `joystream/types` and `@joystream/metadata-protobuf` dependencies.
- Dropped `sudo` based dev commands

### 3.1.1

- `@joystream/types` dependency version bump for consistency with mainnet release versioning

### 3.1.0

- Adds connected query-node's state information to the `/status` endpoint.
- Refactors `QueryNodeApi` initialization (single instance instead of multiple ones) to have persistent apollo client caching, since previously a new client was being initialized for each request leading to entirely new cache object every time.

### 3.0.1

- **FIX** `getAllAssignedDataObjects`: The query to get all assigned objects during sync has been refactored into smaller queries. Each query will now provide no more than 1000 storage bag ids in the input to avoid hitting the request size limit (see: https://github.com/Joystream/joystream/issues/4615).
- Improved error logging for Apollo GraphQL request errors.

### 3.0.0

- **Carthage/Mainnet release:** Breaking change for files upload endpoint, the parameters except the file itself i.e., `dataObjectId`, `storageBucketId` and `bagId` are removed from the request body and are now part of the query string. This allows the pre-validation of the request params to validate the request before the complete file is uploaded successfully,
- API request/response types are now autogenerated from the openapi schema,
- Autogenerated API client library (`@joystream/storage-node-client`) is now part of the storage node codebase.
