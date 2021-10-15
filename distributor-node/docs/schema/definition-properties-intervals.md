## intervals Type

`object` ([Details](definition-properties-intervals.md))

# intervals Properties

| Property                                                        | Type      | Required | Nullable       | Defined by                                                                                                                                                                               |
| :-------------------------------------------------------------- | :-------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [saveCacheState](#savecachestate)                               | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-intervals-properties-savecachestate.md "undefined#/properties/intervals/properties/saveCacheState")                               |
| [checkStorageNodeResponseTimes](#checkstoragenoderesponsetimes) | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-intervals-properties-checkstoragenoderesponsetimes.md "undefined#/properties/intervals/properties/checkStorageNodeResponseTimes") |
| [cacheCleanup](#cachecleanup)                                   | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-intervals-properties-cachecleanup.md "undefined#/properties/intervals/properties/cacheCleanup")                                   |

## saveCacheState

How often, in seconds, will the cache state be saved in `directories.state`. Independently of the specified interval, the node will always try to save cache state before exiting.

`saveCacheState`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-intervals-properties-savecachestate.md "undefined#/properties/intervals/properties/saveCacheState")

### saveCacheState Type

`integer`

### saveCacheState Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## checkStorageNodeResponseTimes

How often, in seconds, will the distributor node attempt to send requests to all current storage node endpoints in order to check how quickly they respond. The node will never make more than 10 such requests concurrently.

`checkStorageNodeResponseTimes`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-intervals-properties-checkstoragenoderesponsetimes.md "undefined#/properties/intervals/properties/checkStorageNodeResponseTimes")

### checkStorageNodeResponseTimes Type

`integer`

### checkStorageNodeResponseTimes Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## cacheCleanup

How often, in seconds, will the distributor node fetch data about all its distribution obligations from the query node and remove all the no-longer assigned data objects from local storage and cache state

`cacheCleanup`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-intervals-properties-cachecleanup.md "undefined#/properties/intervals/properties/cacheCleanup")

### cacheCleanup Type

`integer`

### cacheCleanup Constraints

**minimum**: the value of this number must greater than or equal to: `1`
