## limits Type

`object` ([Details](definition-properties-limits.md))

# limits Properties

| Property                                                                | Type      | Required | Nullable       | Defined by                                                                                                                                                                                 |
| :---------------------------------------------------------------------- | :-------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [storage](#storage)                                                     | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-storage.md "undefined#/properties/limits/properties/storage")                                                     |
| [maxConcurrentStorageNodeDownloads](#maxconcurrentstoragenodedownloads) | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-maxconcurrentstoragenodedownloads.md "undefined#/properties/limits/properties/maxConcurrentStorageNodeDownloads") |
| [maxConcurrentOutboundConnections](#maxconcurrentoutboundconnections)   | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-maxconcurrentoutboundconnections.md "undefined#/properties/limits/properties/maxConcurrentOutboundConnections")   |
| [outboundRequestsTimeoutMs](#outboundrequeststimeoutms)                 | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-outboundrequeststimeoutms.md "undefined#/properties/limits/properties/outboundRequestsTimeoutMs")                 |
| [pendingDownloadTimeoutSec](#pendingdownloadtimeoutsec)                 | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-pendingdownloadtimeoutsec.md "undefined#/properties/limits/properties/pendingDownloadTimeoutSec")                 |
| [maxCachedItemSize](#maxcacheditemsize)                                 | `string`  | Optional | cannot be null | [Distributor node configuration](definition-properties-limits-properties-maxcacheditemsize.md "undefined#/properties/limits/properties/maxCachedItemSize")                                 |
| [dataObjectSourceByObjectIdTTL](#dataobjectsourcebyobjectidttl)         | `integer` | Optional | cannot be null | [Distributor node configuration](definition-properties-limits-properties-dataobjectsourcebyobjectidttl.md "undefined#/properties/limits/properties/dataObjectSourceByObjectIdTTL")         |

## storage

Maximum total size of all (cached) assets stored in `directories.assets`

`storage`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-storage.md "undefined#/properties/limits/properties/storage")

### storage Type

`string`

### storage Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[0-9]+(B|K|M|G|T)$
```

[try pattern](https://regexr.com/?expression=%5E%5B0-9%5D%2B\(B%7CK%7CM%7CG%7CT\)%24 "try regular expression with regexr.com")

## maxConcurrentStorageNodeDownloads

Maximum number of concurrent downloads from the storage node(s)

`maxConcurrentStorageNodeDownloads`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-maxconcurrentstoragenodedownloads.md "undefined#/properties/limits/properties/maxConcurrentStorageNodeDownloads")

### maxConcurrentStorageNodeDownloads Type

`integer`

### maxConcurrentStorageNodeDownloads Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## maxConcurrentOutboundConnections

Maximum number of total simultaneous outbound connections to storage node(s) (excluding proxy connections)

`maxConcurrentOutboundConnections`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-maxconcurrentoutboundconnections.md "undefined#/properties/limits/properties/maxConcurrentOutboundConnections")

### maxConcurrentOutboundConnections Type

`integer`

### maxConcurrentOutboundConnections Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## outboundRequestsTimeoutMs

Timeout for all outbound storage node http requests in miliseconds

`outboundRequestsTimeoutMs`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-outboundrequeststimeoutms.md "undefined#/properties/limits/properties/outboundRequestsTimeoutMs")

### outboundRequestsTimeoutMs Type

`integer`

### outboundRequestsTimeoutMs Constraints

**minimum**: the value of this number must greater than or equal to: `1000`

## pendingDownloadTimeoutSec

Timeout for pending storage node downloads in seconds

`pendingDownloadTimeoutSec`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-pendingdownloadtimeoutsec.md "undefined#/properties/limits/properties/pendingDownloadTimeoutSec")

### pendingDownloadTimeoutSec Type

`integer`

### pendingDownloadTimeoutSec Constraints

**minimum**: the value of this number must greater than or equal to: `60`

## maxCachedItemSize

Maximum size of a data object allowed to be cached by the node

`maxCachedItemSize`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-maxcacheditemsize.md "undefined#/properties/limits/properties/maxCachedItemSize")

### maxCachedItemSize Type

`string`

### maxCachedItemSize Constraints

**pattern**: the string must match the following regular expression: 

```regexp
^[0-9]+(B|K|M|G|T)$
```

[try pattern](https://regexr.com/?expression=%5E%5B0-9%5D%2B\(B%7CK%7CM%7CG%7CT\)%24 "try regular expression with regexr.com")

## dataObjectSourceByObjectIdTTL

TTL (in seconds) for dataObjectSourceByObjectId cache used when proxying objects of size greater than maxCachedItemSize to the right storage node. Defaults to `60` if not specified.

`dataObjectSourceByObjectIdTTL`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-dataobjectsourcebyobjectidttl.md "undefined#/properties/limits/properties/dataObjectSourceByObjectIdTTL")

### dataObjectSourceByObjectIdTTL Type

`integer`

### dataObjectSourceByObjectIdTTL Constraints

**minimum**: the value of this number must greater than or equal to: `1`
