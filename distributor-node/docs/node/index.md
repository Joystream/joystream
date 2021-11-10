<!-- AUTO-GENERATED-CONTENT:START (TOC:firsth1=true) -->
- [The API](#the-api)
  - [Requesting assets](#requesting-assets)
    - [Scenario 1 (cache hit)](#scenario-1-cache-hit)
    - [Scenario 2 (pending)](#scenario-2-pending)
      - [Scenario 2.1: No `Range` header was provided with a request or the `Range` start is `<= partiallyDownloadedContentSize`](#scenario-21-no-range-header-was-provided-with-a-request-or-the-range-start-is--partiallydownloadedcontentsize)
      - [Scenario 2.2: `Range` header was provided with a request and `Range` start is `> partiallyDownloadedContentSize`](#scenario-22-range-header-was-provided-with-a-request-and-range-start-is--partiallydownloadedcontentsize)
    - [Scenario 3 (cache miss)](#scenario-3-cache-miss)
      - [Scenario 3.1: The requested data object is not found](#scenario-31-the-requested-data-object-is-not-found)
      - [Scenario 3.2: The object is not distributed by the node](#scenario-32-the-object-is-not-distributed-by-the-node)
      - [Scenario 3.3: The request is valid, the node needs to fetch the missing object](#scenario-33-the-request-is-valid-the-node-needs-to-fetch-the-missing-object)
  - [Checking asset status](#checking-asset-status)
  - [API limits](#api-limits)
    - [Example Nginx configuration](#example-nginx-configuration)
    - [System configuration](#system-configuration)
- [Data fetching](#data-fetching)
  - [Finding nearby storage nodes:](#finding-nearby-storage-nodes)
  - [Data object fetching flow](#data-object-fetching-flow)
- [Metadata](#metadata)
  - [DistributionBucketFamilyMetadata](#distributionbucketfamilymetadata)
    - [Geographical areas covered by the distirbution bucket family](#geographical-areas-covered-by-the-distirbution-bucket-family)
    - [Using latency tests for choosing a family](#using-latency-tests-for-choosing-a-family)
  - [Distribution bucket operator metadata](#distribution-bucket-operator-metadata)
- [State](#state)
- [Caching](#caching)
  - [Caching policy](#caching-policy)
    - [LRU groups](#lru-groups)
  - [Cache cleanup](#cache-cleanup)
- [Logging](#logging)
- [Query node integration](#query-node-integration)
<!-- AUTO-GENERATED-CONTENT:END -->

<a name="the-api"></a>

# The API

The Distributor Node exposes an HTTP api implemented with [ExpressJS](https://expressjs.com/).

The api is described by an [OpenAPI](https://swagger.io/specification/) schema located at _[src/api-spec/openapi.yml](../../src/api-spec/openapi.yml)_

**Current, detailed api documentation can be found [here](../api/index.md)**

<a name="requesting-assets"></a>

## Requesting assets

The assets are requested from the distributor node by using a `GET` request to [`/assets/{objectId}`](../api/index.md#opIdpublic.asset) endpoint.

There are multiple scenarios of how a distributor will act upon that request, depending on its current state:

<a name="scenario-1"></a>

### Scenario 1 (cache hit)

**The requested data object is already available in the distributor node's filesystem (cache)**

In this case:
- Object's [LRU-SP cache state](#caching-policy) is updated
- The [`send`](https://www.npmjs.com/package/send) library is used to handle the request and serve the object. The library supports, among others, partial responses (`Ranges`) and conditional-GET negotiation (`If-Match`, `If-Unmodified-Since`, `If-None-Match`, `If-Modified-Since`).
- `cache-control: max-age` is set to `31536000` (one year), which is a common practice for informing the browser that the object can essentially be cached "forever" (minimizing the number of request for the same data object)
- `x-cache: hit` and `x-data-source: local` headers are sent, providing the client detailed information about the triggered scenario (see: [_public.assets Responses_](../api/index.md#public.asset-responses)).

<a name="scenario-2"></a>

### Scenario 2 (pending)

**The object is not yet cached, but is currently being fetched from the storage node**

In this case `cache-control: max-age` is set to a substantially lower value (currently `180`), as the distributor node cannot yet confirm whether the object being fetched is indeed valid.

<a name="scenario-2-1"></a>

#### Scenario 2.1: No `Range` header was provided with a request or the `Range` start is `<= partiallyDownloadedContentSize`

In this case:

- The data is streamed into the response from the local, partially downloaded file. All the data that gets written into the local file, as it's being downloaded from the storage node, is beeing simultaneously read from the file (using a small interval) and immediately pushed into the http response.
- `x-cache: pending` and `x-data-source: local` headers are sent, providing the client detailed information about the triggered scenario (see: [_public.assets Responses_](../api/index.md#public.asset-responses)).

<a name="scenario-2-2"></a>

#### Scenario 2.2: `Range` header was provided with a request and `Range` start is `> partiallyDownloadedContentSize`

In this case streaming the response from partially downloaded file, like in the scenario above, may cause unnecessary delay, because the requested `Range` may target the very end of the file (which will only be available locally once the entire data object is fetched). That's why in this case:
- The request is forwarded to the storage node (that the data object is currently being downloaded from) via [express-http-proxy](https://www.npmjs.com/package/express-http-proxy)
- `x-cache: pending` and `x-data-source: external` headers are sent, providing the client detailed information about the triggered scenario (see: [_public.assets Responses_](../api/index.md#public.asset-responses)).

<a name="scenario-3"></a>
### Scenario 3 (cache miss)

In this case the distributor node is making an additional request to the query node in order to fetch details of the requested object, including:
- content hash,
- object size,
- storage buckets assigned to store the object,
- distribution buckets assigned to distribute the object

It then proceeds to one of the following scenarios:

<a name="scenario-3-1"></a>

#### Scenario 3.1: The requested data object is not found

Node responds with `HTTP 404 (Not Found)` and a message

<a name="scenario-3-2"></a>

#### Scenario 3.2: The object is not distributed by the node

Node responds with `HTTP 421 (Misdirected Request)` and a message

<a name="scenario-3-3"></a>

#### Scenario 3.3: The request is valid, the node needs to fetch the missing object

In this case
- The process of fetching the data object from storage node described in the [Data fetching](#data-fetching) section below is triggered.
- Once the storage node from which the object is going to be fetched is chosen, the request is handled in a way analogous to the one described in [Scenario 2](#scenario-2), with the exception that `x-cache: miss` header will be sent instead of `x-cache: pending`.

<a name="checking-asset-status"></a>

## Checking asset status

It is possible to check an asset status without affecting the distributor node state in any way (for example - by triggering the process of [fetching the missing data object](#data-fetching)), by sending a [`HEAD` request to `/assets/{objectId}`](../api/index.md#opIdpublic.assetHead) endpoint.

If the request is valid, the node will respond with, among others, the `x-cache`, `content-length`, `cache-control` headers.

In case the request is not invalid, the node will respond with the same status code it would in case of an invalid `GET` request.

<a name="api-limits"></a>

## API limits

There are no rate / connection limits on incoming requests enforced by the node, it is therefore recommended to use a firewall or reverse proxy in order to protect the node from DOS/DDOS attacks.

The outbound connections (from distributor node to storage nodes) however can be limited with [`limits`](../schema/definition-properties-limits.md) configuration settings.

<a name="example-nginx-configuration"></a>

### Example Nginx configuration

```
upstream distributor {
    server 127.0.0.1:3334;
}

http {
  # Create a conn_perip zone that will keep track of concurrent connections by ip
  limit_conn_zone $binary_remote_addr zone=conn_perip:10m;

  server {
    server_name example-distributor-node;
    listen 443;

    # Limit to max 20 connections per ip at a time
    limit_conn addr 20;

    location / {
      proxy_pass http://distributor/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $http_host;

      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forward-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forward-Proto http;
      proxy_set_header X-Nginx-Proxy true;

        proxy_redirect off;
    }

    # SSL and other configuration...
  }
}
```

Because Nginx does not support [HTTP pipelining](https://en.wikipedia.org/wiki/HTTP_pipelining), by limiting the number of concurrent connections per ip we also limit the number of data objects that can be concurrently fetched from the distributor node by a single IP.

Having in mind that [most browsers will not make more than 6 concurrent connections](https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html), the limit of `20` concurrent connections per ip should be more than sufficient.

<a name="system-configuration"></a>

### System configuration

When configuring the limits, keep in mind that a lot of simultaneous connections may also cause some OS limits to be hit.

For example, the default limit of file descriptors a single process can open on Linux systems is `1024`. If left unchanged, this limit can easily cause problems, as this means only `1024` connections can be handled concurrently. In reality this number will be much lower for distributor node, because:
- Each connection will require 1 file descriptor for a socket
- Each incoming connection will most likely require an asset (data object) file to be accessed, which will take another descriptor,
- Each incoming connection may trigger many outbound connections (see [Data fetching](#data-fetching) section below) in case of cache miss, in worst case taking over 10 more descriptors

For Linux users it is recommended to either run the distributor node using the docker image, which already has high limits set, or [modify the max open file descriptors limit manually](https://docs.oracle.com/cd/E19623-01/820-6168/file-descriptor-requirements.html)

<a name="data-fetching"></a>

# Data fetching

<a name="finding-nearby-storage-nodes"></a>

## Finding nearby storage nodes:

In order to limit the number of requests being made on cache miss and the time it takes to fetch a new object [in this scenario](#scenario-3), the distributor node needs to keep track of how quickly (on average) the currently available storage nodes are responding to requests.

This can be partially solved by making use of the on-chain metadata provided by storage node operators, which may include details about the node location (see [Metadata](#metadata) section) that can provide some estimation of which nodes will likely respond faster. However, because this approach is quite limited and it's possible that most storage providers will choose not to expose their node location, the distributor node instead uses a different approach to find nearby nodes.

Currently the distributor node periodically (every [`intervals.checkStorageNodeResponseTimes`](../schema/definition-properties-intervals.md#checkstoragenoderesponsetimes) seconds) fetches all active storage provider endpoints (from the query node) and measures their average response times to `/status/version` requests. This is done independently of any incoming requests. The "response time check" requests are queued using relatively small concurrency limit (10) in order to make the cost of this operation minimal.

This provides a pretty good estimation on which nodes will likely be the best candidates for fetching data objects during a cache miss, it also allows filtering-out storage nodes that don't respond at all or respond with an error.

<a name="data-object-fetching-flow"></a>

## Data object fetching flow

During the [cache miss scenario (`Scenario 3.3`)](#scenario-3-3), the following tasks are executed:

First, the endpoints of all storage providers that are supposed to store the given object are ordered by the mean response time using 10 last response times (the process of obtaining those measurements is described in the [previous section](#finding-nearby-storage-nodes))

The `HEAD /files/{objectId}` requests are then sent to the storage endpoints, starting from the ones with lowest mean response time. Those initial requests are only meant to determine whether a given storage node can indeed serve the object. In fact, all those requests are put (in the specified order) in the `availabilityCheckQueue` which then executes them with a constant maximum concurrency (`10` at the time of writing).

As soon as any storage node confirms the availability of the object, the `availabilityCheckQueue` is temporarily stopped and `GET /files/{objectId}` request is made to fetch the full data from the selected provider. Because the distributor node uses `Connection: keep-alive` headers when sending requests to storage nodes, there's no need to re-establish a TCP connection at this point, which can save a considerable amount of time. If other storage providers confirm the availability of the object during this time, other `GET` requests will be added to `objectDownloadQueue` (which uses a concurrency of 1), allowing the distributor node to instantly try a different provider in case the first `GET` request fails. The process continues until a storage node that responds with `HTTP 200` to a `GET` request is found.

Once some storage node responds with `HTTP 200` and starts streaming the data, all other requests related to that data object are stopped and the distributor node begins to write the data into its filesystem. Any errors at this point (unexpected data size, stream errors) will mean that the fetching process has failed, causing the data object and any related state to be dropped and the whole process of fetching the object to potentially be re-tried upon another request.

<a name="metadata"></a>

# Metadata

The documentation of current storage&distribution system on-chain metadata standard can be found [here](../../../metadata-protobuf/doc/index.md#proto/Storage.proto)

[Distributor node metadata](#distribution-bucket-operator-metadata) can be set using [`operator:set-metadata`](../commands/operator.md#joystream-distributor-operatorset-metadata) command in Distributor Node CLI.

[Distribution family metadata](#distribution-bucket-family-metadata) can be set using [`leader:set-bucket-family-metadata`](../commands/leader.md#joystream-distributor-leaderset-bucket-family-metadata)

Once set, the metadata can be accessed from the Query Node with a GraphQL query like, for example:
```graphql
query {
  distributionBuckets {
    family {
      metadata {
        region
        description
        latencyTestTargets
        areas {
          area {
            __typename
            ...on GeographicalAreaCountry {
              countryCode: code
            }
            ...on GeographicalAreaContinent {
              continentCode: code
            }
            ...on GeographicalAreaSubdivistion {
              subdivisionCode: code
            }
          }
        }
      }
    }
    operators {
      metadata {
        nodeEndpoint
        nodeLocation {
          countryCode
          coordinates {
            latitude
            longitude
          }
        }
        extra
      }
    }
  }
}
```

<a name="distribution-bucket-family-metadata"></a>

## DistributionBucketFamilyMetadata

The main purpose of distribution family metadata is to help client (frontend) applications find out which distribution nodes should be preferred when fetching assets.

Although each node operator may choose to expose its own node location in the [DistributionBucketOperatorMetadata](#distribution-bucket-operator-metadata), it is generally assumed that all nodes belonging to a given family will have a good-enough latency in the region covered by this family, so they can be treated more-or-less equally.

What exactly constitutes a `region` in the `DistributionBucketFamilyMetadata` is not strictly enforced and the current metadata standard remains quite flexible in that regard.

<a name="geographical-areas-covered-by-the-distirbution-bucket-family"></a>

### Geographical areas covered by the distirbution bucket family

Initially, as the number of distribution nodes will probably be limited, a region can mean a relatively large geographic area (ie. a continent or part of a continent). Later, as the network grows, the region may mean a single country / subdivision or a small set of nearby countries / subdivisions.

In order to support all those cases, the `areas` field in the `DistributionBucketFamilyMetadata` allows specifying either one or multiple geographical areas covered by the family, where each area can be either:
- a continent uniquely identified by `Continent` enum value, _or_
- a country uniquely identified by [`ISO-3166-1 alpha-2`](https://en.wikipedia.org/wiki/ISO_3166-2) country code, _or_
- a subdivision (for example, a state) uniquely identified by [`ISO_3166-2`](https://en.wikipedia.org/wiki/ISO_3166-2) subdivision code

There are multiple ways client applications may be able to determine most suitable regions:

- Using [`HTML5 geolocation API`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) and reverse geocoding (which can be done either using a local dataset, custom backend or an external service)
- using GeoDNS or a backend service to establish the approximate location before rendering the interface
- Prompting the user to manually provide the preferred region

<a name="using-latency-tests-for-choosing-a-family"></a>

### Using latency tests for choosing a family

Another way to choose the most appropriate region may be to perform an initial latency check by pinging endpoints that are supposed to give the most representative results for given family (for example, https://www.cloudping.info/ can perform such measurements using endpoints that represent AWS regions).

In order to facilitate this, `latency_test_targets` field in the `DistributionBucketFamilyMetadata` allows specifying the list of representative ips / hosts to be used for such measurements. Alternatively a chosen set of distribution nodes themselves may also be used.

<a name="distribution-bucket-operator-metadata"></a>

## Distribution bucket operator metadata

The most essential part of `DistributionBucketOperatorMetadata` is the node API root endpoint, it must be provided by all active node operators, otherwise no app will be able to access the node.

The node operator may optionally choose to expose more details about the node, like specific `location` metadata or some additional `extra` information.

<a name="state"></a>

# State

The distributor node state is divided into memory state (recreated on startup) and persistent state (stored in filesystem).

Most of the state is managed via via an "intermediary" service called [`StateCacheService`](../../src/services/cache/StateCacheService.ts). This is to facilitate the potential migration to other state management approaches, like using `Redis` in the future. Currently the service automatically saves the persistent state to the filesystem every [`intervals.saveCacheState`](../schema/definition-properties-intervals.md#savecachestate) seconds. It also tries to save the state every time the node is exiting.

The current state includes:

**Memory state**
- `pendingDownloadsByObjectId` map - stores information about currently pending downloads (data object fetching attempts). Each pending download can be in one of the following states:
  - `Waiting` - in case [`limits.maxConcurrentStorageNodeDownloads`](../schema/definition-properties-limits.md#maxconcurrentstoragenodedownloads) limit is reached, this is the status of pending downloads that are waiting in the queue. It is also the initial status of all pending downloads in general.
  - `LookingForSource` - the process of looking for a storage node that is able to serve the asset has started, but the source node has not yet been chosen.
  - `Downloading` - the source storage node has been chosen and the data object is being downloaded.
- `storageNodeEndpointDataByEndpoint` map - currently stores the last 10 average mean response times mapped by storage nodes endpoints (see: [_Finding nearby storage nodes_](#finding-nearby-storage-nodes))
- `groupNumberByObjectId` map - stores the LRU-SP cache group number (see: [_Caching policy_](#caching-policy)) of each cached data object.

**Persistent state**
- `lruCacheGroups` - list of LRU-SP cache groups. Each LRU group contains a map of cached data object details (size, popularity, last access time) required to to calculate its `cost` parameter (see: [_Caching policy_](#caching-policy))
- `mimeTypeByObjectId` map - stores the `mimeType` (as determined by the distributor node) of each cached data object

<a name="caching"></a>

# Caching

<a name="caching-policy"></a>

## Caching policy

The caching policy used for the data objects stored by the distributor node is called **[`LRU-SP`](http://www.is.kyusan-u.ac.jp/~chengk/pub/papers/compsac00_A07-07.pdf)**.

This caching policy was designed specifically for the web and it takes into account the following 3 properties of a data object:
- object size (`s`)
- object popularity (number of times it was requested while being cached) (`p`)
- time elapsed since the object was last requested (`t`)

The cost function of a cache item is described by the formula: `t * s / p`.
Objects with highest cost are the first to be evicted in case [`limits.storage`](../schema/definition-properties-limits.md#storage) limit is reached.

<a name="lru-groups"></a>

### LRU groups

For efficiency, the cache is divided into `LRU` ([_Least recently used_](https://en.wikipedia.org/wiki/Page_replacement_algorithm#Least_recently_used)) sets (groups) such that all objects in a given group share the same integer value of `log2(s / p)`. In the current distributor node implementation, the unit used for `s` (object size) is `KB` (kilobytes). This means that if we have 24 LRU groups and assume `p = 1` (_popularity = 1_) for all objects, first LRU group will contain objects of size `1 - 2 KB`, second one `2 - 4 KB` etc. up until 24-th group with objects of size `8 - 16 GB` (or `2^23 KB - 2^24 KB`).

When the object is being requested, we're incrementing its `p` and checking the current value of `log2(s / p)`. Then we're calling `SetA.delete(object)` + `SetB.add(object)` (either moving the item to a different LRU set based on current `log2(s / p)`, in which case `SetA` !== `SetB`, or just moving the item to the "top" of the current set, in which case `SetA` === `SetB`). All of those operations are very quick and don't require any costly iterations.

In order to find the best eviction candidate, we're taking the "bottom" item from each LRU set and then choose an element with lowest `t * s / p` (which is also a low-cost operation, considering we need only ~24 LRU groups)

<a name="cache-cleanup"></a>

## Cache cleanup

No-longer-distributed data objects are dropped from the cache periodically every [`intervals.cacheCleanup`](../schema/definition-properties-intervals.md#cachecleanup) seconds. During this time the distributor node will fetch all its current on-chain obligations using the query node and drop any objects that are part of the cache but not part of the obligations from both the cache state and filesystem.

<a name="logging"></a>

# Logging

The distributor node supports detailed logging with [winston](https://www.npmjs.com/package/winston) library. [NPM log levels](https://www.npmjs.com/package/winston#logging-levels) are used to specify the log priority.

The logs can be directed to some of the 3 available outputs, depending on the [`logs`](../schema/definition-properties-logs.md) configuration settings:
- console ([`logs.console`](../schema/definition-properties-logs-properties-console.md))
- log file(s) ([`logs.file`](../schema/definition-properties-logs-properties-file.md))
- an elasticsearch endpoint ([`logs.elastic`](../schema/definition-properties-logs-properties-elastic.md))

# Query node integration

Because the distributor node is making requests to a query node:
- on [cache miss](#scenario-3)
- periodically, for [cache cleanup](#cache-cleanup) purposes

In order to achieve the best perfomance it is recommended to either run the query-node processor and graphql server on the same machine the distributor node will be running on, or use a query node endpoint that can be accessed with a minimal latency.

Taking the [docker-compose.yml](../../docker-compose.yml) example, the services that could be run on the same machine may include:
- `db`
- `processor`
- `graphql-server`
- `distributor-node`

The `INDEXER_ENDPOINT_URL` can be point to a completely external indexer endpoint, as the latency between `processor` and `indexer` is less of an issue in this case.
