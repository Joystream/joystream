## directories Type

`object` ([Details](definition-properties-directories.md))

# directories Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                                             |
| :------------------------ | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [assets](#assets)         | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-directories-properties-assets.md "undefined#/properties/directories/properties/assets")         |
| [cacheState](#cachestate) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-directories-properties-cachestate.md "undefined#/properties/directories/properties/cacheState") |
| [logs](#logs)             | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-directories-properties-logs.md "undefined#/properties/directories/properties/logs")             |

## assets

Path to a directory where all the cached assets will be stored

`assets`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories-properties-assets.md "undefined#/properties/directories/properties/assets")

### assets Type

`string`

## cacheState

Path to a directory where information about the current cache state will be stored (LRU-SP cache data, stored assets mime types etc.)

`cacheState`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories-properties-cachestate.md "undefined#/properties/directories/properties/cacheState")

### cacheState Type

`string`

## logs

Path to a directory where logs will be stored if logging to a file was enabled (via `log.file`).

`logs`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories-properties-logs.md "undefined#/properties/directories/properties/logs")

### logs Type

`string`
