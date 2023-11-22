## elastic Type

`object` ([Elasticsearch logging options](definition-properties-logs-properties-elasticsearch-logging-options.md))

# elastic Properties

| Property                    | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                                              |
| :-------------------------- | :------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [level](#level)             | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/level")                      |
| [endpoint](#endpoint)       | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-endpoint.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/endpoint")       |
| [indexPrefix](#indexprefix) | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-indexprefix.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/indexPrefix") |
| [auth](#auth)               | `object` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-auth.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/auth")               |

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

### endpoint Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")

## indexPrefix

Elasticsearch data stream prefix to push the logs to. `-${config.id}` will be automatically appended. If not provided, will fallback to "logs-argus"

`indexPrefix`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-indexprefix.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/indexPrefix")

### indexPrefix Type

`string`

## auth

Elasticsearch basic authentication credentials

`auth`

*   is optional

*   Type: `object` ([Details](definition-properties-logs-properties-elasticsearch-logging-options-properties-auth.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options-properties-auth.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic/properties/auth")

### auth Type

`object` ([Details](definition-properties-logs-properties-elasticsearch-logging-options-properties-auth.md))
