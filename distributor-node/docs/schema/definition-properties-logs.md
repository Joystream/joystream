## logs Type

`object` ([Details](definition-properties-logs.md))

# logs Properties

| Property            | Type   | Required | Nullable       | Defined by                                                                                                                                                          |
| :------------------ | :----- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [file](#file)       | Merged | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file")       |
| [console](#console) | Merged | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-console.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console") |
| [elastic](#elastic) | Merged | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elastic.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic") |

## file



`file`

*   is optional

*   Type: merged type ([Details](definition-properties-logs-properties-file.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file")

### file Type

merged type ([Details](definition-properties-logs-properties-file.md))

one (and only one) of

*   [File logging options](definition-properties-logs-properties-file-oneof-file-logging-options.md "check type definition")

*   [Switch off](definition-properties-logs-properties-file-oneof-switch-off.md "check type definition")

## console



`console`

*   is optional

*   Type: merged type ([Details](definition-properties-logs-properties-console.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-console.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console")

### console Type

merged type ([Details](definition-properties-logs-properties-console.md))

one (and only one) of

*   [Console logging options](definition-properties-logs-properties-console-oneof-console-logging-options.md "check type definition")

*   [Switch off](definition-properties-logs-properties-file-oneof-switch-off.md "check type definition")

## elastic



`elastic`

*   is optional

*   Type: merged type ([Details](definition-properties-logs-properties-elastic.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-elastic.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic")

### elastic Type

merged type ([Details](definition-properties-logs-properties-elastic.md))

one (and only one) of

*   [Elasticsearch logging options](definition-properties-logs-properties-elastic-oneof-elasticsearch-logging-options.md "check type definition")

*   [Switch off](definition-properties-logs-properties-file-oneof-switch-off.md "check type definition")
