## logs Type

`object` ([Details](definition-properties-logs.md))

# logs Properties

| Property            | Type     | Required | Nullable       | Defined by                                                                                                                                                                                |
| :------------------ | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [file](#file)       | `object` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-file-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file")             |
| [console](#console) | `object` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-console-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console")       |
| [elastic](#elastic) | `object` | Optional | cannot be null | [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic") |

## file



`file`

*   is optional

*   Type: `object` ([File logging options](definition-properties-logs-properties-file-logging-options.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-file-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/file")

### file Type

`object` ([File logging options](definition-properties-logs-properties-file-logging-options.md))

## console



`console`

*   is optional

*   Type: `object` ([Console logging options](definition-properties-logs-properties-console-logging-options.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-console-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/console")

### console Type

`object` ([Console logging options](definition-properties-logs-properties-console-logging-options.md))

## elastic



`elastic`

*   is optional

*   Type: `object` ([Elasticsearch logging options](definition-properties-logs-properties-elasticsearch-logging-options.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs-properties-elasticsearch-logging-options.md "https://joystream.org/schemas/argus/config#/properties/logs/properties/elastic")

### elastic Type

`object` ([Elasticsearch logging options](definition-properties-logs-properties-elasticsearch-logging-options.md))
