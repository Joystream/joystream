`joystream-distributor node`
============================

Commands for interacting with a running distributor node through OperatorApi

* [`joystream-distributor node:set-buckets`](#joystream-distributor-nodeset-buckets)
* [`joystream-distributor node:set-worker`](#joystream-distributor-nodeset-worker)
* [`joystream-distributor node:shutdown`](#joystream-distributor-nodeshutdown)
* [`joystream-distributor node:start-public-api`](#joystream-distributor-nodestart-public-api)
* [`joystream-distributor node:stop-public-api`](#joystream-distributor-nodestop-public-api)

## `joystream-distributor node:set-buckets`

Send an api request to change the set of buckets distributed by given distributor node.

```
USAGE
  $ joystream-distributor node:set-buckets

OPTIONS
  -B, --bucketIds=bucketIds    Set of bucket ids to distribute. Each bucket id should be in {familyId}:{bucketIndex}
                               format. Multiple ids can be provided, separated by space.

  -a, --all                    Distribute all buckets belonging to configured worker

  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -s, --secret=secret          HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)

  -u, --url=url                (required) Distributor node operator api base url (ie. http://localhost:3335)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations

EXAMPLES
  $ joystream-distributor node:set-buckets --bucketIds 1:1 1:2 1:3 2:1 2:2
  $ joystream-distributor node:set-buckets --all
```

_See code: [src/commands/node/set-buckets.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/node/set-buckets.ts)_

## `joystream-distributor node:set-worker`

Send an api request to change workerId assigned to given distributor node instance.

```
USAGE
  $ joystream-distributor node:set-worker

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -s, --secret=secret          HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)

  -u, --url=url                (required) Distributor node operator api base url (ie. http://localhost:3335)

  -w, --workerId=workerId      (required) New workerId to set

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/node/set-worker.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/node/set-worker.ts)_

## `joystream-distributor node:shutdown`

Send an api request to shutdown given distributor node.

```
USAGE
  $ joystream-distributor node:shutdown

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -s, --secret=secret          HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)

  -u, --url=url                (required) Distributor node operator api base url (ie. http://localhost:3335)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/node/shutdown.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/node/shutdown.ts)_

## `joystream-distributor node:start-public-api`

Send an api request to start public api of given distributor node.

```
USAGE
  $ joystream-distributor node:start-public-api

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -s, --secret=secret          HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)

  -u, --url=url                (required) Distributor node operator api base url (ie. http://localhost:3335)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/node/start-public-api.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/node/start-public-api.ts)_

## `joystream-distributor node:stop-public-api`

Send an api request to stop public api of given distributor node.

```
USAGE
  $ joystream-distributor node:stop-public-api

OPTIONS
  -c, --configPath=configPath  [default: ./config.yml] Path to config JSON/YAML file (relative to current working
                               directory)

  -s, --secret=secret          HMAC secret key to use (will default to config.operatorApi.hmacSecret if present)

  -u, --url=url                (required) Distributor node operator api base url (ie. http://localhost:3335)

  -y, --yes                    Answer "yes" to any prompt, skipping any manual confirmations
```

_See code: [src/commands/node/stop-public-api.ts](https://github.com/Joystream/joystream/blob/v0.1.0/src/commands/node/stop-public-api.ts)_
