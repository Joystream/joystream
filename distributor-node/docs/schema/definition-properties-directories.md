## directories Type

`object` ([Details](definition-properties-directories.md))

# directories Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                                                                              |
| :------------------------ | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [assets](#assets)         | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-directories-properties-assets.md "https://joystream.org/schemas/argus/config#/properties/directories/properties/assets")         |
| [cacheState](#cachestate) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-directories-properties-cachestate.md "https://joystream.org/schemas/argus/config#/properties/directories/properties/cacheState") |

## assets

Path to a directory where all the cached assets will be stored

`assets`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories-properties-assets.md "https://joystream.org/schemas/argus/config#/properties/directories/properties/assets")

### assets Type

`string`

## cacheState

Path to a directory where information about the current cache state will be stored (LRU-SP cache data, stored assets mime types etc.)

`cacheState`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories-properties-cachestate.md "https://joystream.org/schemas/argus/config#/properties/directories/properties/cacheState")

### cacheState Type

`string`
