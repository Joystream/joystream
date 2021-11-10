## 0 Type

`object` ([Console logging options](definition-properties-logs-properties-console-oneof-console-logging-options.md))

# 0 Properties

| Property        | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                                            |
| :-------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [level](#level) | `string` | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-oneof-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console/oneOf/0/properties/level") |

## level

Minimum level of logs sent to this output

`level`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-oneof-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console/oneOf/0/properties/level")

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
