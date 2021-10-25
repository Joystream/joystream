## limits Type

`object` ([Details](definition-properties-limits.md))

# limits Properties

| Property                                                                | Type      | Required | Nullable       | Defined by                                                                                                                                                                                 |
| :---------------------------------------------------------------------- | :-------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [storage](#storage)                                                     | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-storage.md "undefined#/properties/limits/properties/storage")                                                     |
| [maxConcurrentStorageNodeDownloads](#maxconcurrentstoragenodedownloads) | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-maxconcurrentstoragenodedownloads.md "undefined#/properties/limits/properties/maxConcurrentStorageNodeDownloads") |
| [maxConcurrentOutboundConnections](#maxconcurrentoutboundconnections)   | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-maxconcurrentoutboundconnections.md "undefined#/properties/limits/properties/maxConcurrentOutboundConnections")   |
| [outboundRequestsTimeout](#outboundrequeststimeout)                     | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-limits-properties-outboundrequeststimeout.md "undefined#/properties/limits/properties/outboundRequestsTimeout")                     |

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

Maximum number of total simultaneous outbound connections to storage node(s)

`maxConcurrentOutboundConnections`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-maxconcurrentoutboundconnections.md "undefined#/properties/limits/properties/maxConcurrentOutboundConnections")

### maxConcurrentOutboundConnections Type

`integer`

### maxConcurrentOutboundConnections Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## outboundRequestsTimeout

Timeout for all outbound storage node http requests in miliseconds

`outboundRequestsTimeout`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits-properties-outboundrequeststimeout.md "undefined#/properties/limits/properties/outboundRequestsTimeout")

### outboundRequestsTimeout Type

`integer`

### outboundRequestsTimeout Constraints

**minimum**: the value of this number must greater than or equal to: `1`
