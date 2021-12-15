## file Type

`object` ([File logging options](definition-properties-logs-properties-file-logging-options.md))

# file Properties

| Property                | Type      | Required | Nullable       | Defined by                                                                                                                                                                                                              |
| :---------------------- | :-------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [level](#level)         | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/level")         |
| [path](#path)           | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-path.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/path")           |
| [maxFiles](#maxfiles)   | `integer` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-maxfiles.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/maxFiles")   |
| [maxSize](#maxsize)     | `integer` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-maxsize.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/maxSize")     |
| [frequency](#frequency) | `string`  | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-frequency.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/frequency") |
| [archive](#archive)     | `boolean` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-archive.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/archive")     |

## level

Minimum level of logs sent to this output

`level`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-level.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/level")

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

## path

Path where the logs will be stored (absolute or relative to config file)

`path`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-path.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/path")

### path Type

`string`

## maxFiles

Maximum number of log files to store

`maxFiles`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-maxfiles.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/maxFiles")

### maxFiles Type

`integer`

### maxFiles Constraints

**minimum**: the value of this number must greater than or equal to: `1`

## maxSize

Maximum size of a single log file in bytes

`maxSize`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-maxsize.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/maxSize")

### maxSize Type

`integer`

### maxSize Constraints

**minimum**: the value of this number must greater than or equal to: `1024`

## frequency

The frequency of creating new log files (regardless of maxSize)

`frequency`

*   is optional

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-frequency.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/frequency")

### frequency Type

`string`

### frequency Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value       | Explanation |
| :---------- | :---------- |
| `"yearly"`  |             |
| `"monthly"` |             |
| `"daily"`   |             |
| `"hourly"`  |             |

### frequency Default Value

The default value is:

```json
"daily"
```

## archive

Whether to archive old logs

`archive`

*   is optional

*   Type: `boolean`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options-properties-archive.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file/properties/archive")

### archive Type

`boolean`
