## elastic Type

`object` ([Elasticsearch logging options](definition-properties-logs-properties-elasticsearch-logging-options.md))

# elastic Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                                        |
| :-------------------- | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [level](#level)       | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/level")                |
| [endpoint](#endpoint) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-endpoint.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/endpoint") |

## level

Minimum level of logs sent to this output

`level`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/level")

### level Type

`string`

### level Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | :---------- |
| `"error"`   |             |
| `"warn"`    |             |
| `"info"`    |             |
| `"http"`    |             |
| `"verbose"` |             |
| `"debug"`   |             |
| `"silly"`   |             |

## endpoint

Elastichsearch endpoint to push the logs to (for example: <http://localhost:9200>)

`endpoint`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-endpoint.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/endpoint")

### endpoint Type

`string`
