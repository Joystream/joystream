## log Type

`object` ([Details](definition-properties-log.md))

# log Properties

| Property            | Type     | Required | Nullable       | Defined by                                                                                                                       |
| :------------------ | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| [file](#file)       | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-log-properties-file.md "undefined#/properties/log/properties/file")       |
| [console](#console) | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-log-properties-console.md "undefined#/properties/log/properties/console") |
| [elastic](#elastic) | `string` | Optional | cannot be null | [Distributor node configuration](definition-properties-log-properties-elastic.md "undefined#/properties/log/properties/elastic") |

## file

Minimum level of logs written to a file specified in `directories.logs`

`file`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-log-properties-file.md "undefined#/properties/log/properties/file")

### file Type

`string`

### file Constraints

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
| `"off"`     |             |

## console

Minimum level of logs outputted to a console

`console`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-log-properties-console.md "undefined#/properties/log/properties/console")

### console Type

`string`

### console Constraints

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
| `"off"`     |             |

## elastic

Minimum level of logs sent to elasticsearch endpoint specified in `endpoints.elasticSearch`

`elastic`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-log-properties-elastic.md "undefined#/properties/log/properties/elastic")

### elastic Type

`string`

### elastic Constraints

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
| `"off"`     |             |
