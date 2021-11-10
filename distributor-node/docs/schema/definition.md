## Distributor node configuration Type

`object` ([Distributor node configuration](definition.md))

# Distributor node configuration Properties

| Property                    | Type      | Required | Nullable       | Defined by                                                                                                                                  |
| :-------------------------- | :-------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| [id](#id)                   | `string`  | Required | cannot be null | [Distributor node configuration](definition-properties-id.md "https://joystream.org/schemas/argus/config#/properties/id")                   |
| [endpoints](#endpoints)     | `object`  | Required | cannot be null | [Distributor node configuration](definition-properties-endpoints.md "https://joystream.org/schemas/argus/config#/properties/endpoints")     |
| [directories](#directories) | `object`  | Required | cannot be null | [Distributor node configuration](definition-properties-directories.md "https://joystream.org/schemas/argus/config#/properties/directories") |
| [logs](#logs)               | `object`  | Optional | cannot be null | [Distributor node configuration](definition-properties-logs.md "https://joystream.org/schemas/argus/config#/properties/logs")               |
| [limits](#limits)           | `object`  | Required | cannot be null | [Distributor node configuration](definition-properties-limits.md "https://joystream.org/schemas/argus/config#/properties/limits")           |
| [intervals](#intervals)     | `object`  | Required | cannot be null | [Distributor node configuration](definition-properties-intervals.md "https://joystream.org/schemas/argus/config#/properties/intervals")     |
| [port](#port)               | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-port.md "https://joystream.org/schemas/argus/config#/properties/port")               |
| [keys](#keys)               | `array`   | Required | cannot be null | [Distributor node configuration](definition-properties-keys.md "https://joystream.org/schemas/argus/config#/properties/keys")               |
| [buckets](#buckets)         | Merged    | Required | cannot be null | [Distributor node configuration](definition-properties-buckets.md "https://joystream.org/schemas/argus/config#/properties/buckets")         |
| [workerId](#workerid)       | `integer` | Required | cannot be null | [Distributor node configuration](definition-properties-workerid.md "https://joystream.org/schemas/argus/config#/properties/workerId")       |

## id

Node identifier used when sending elasticsearch logs and exposed on /status endpoint

`id`

*   is required

*   Type: `string`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-id.md "https://joystream.org/schemas/argus/config#/properties/id")

### id Type

`string`

### id Constraints

**minimum length**: the minimum number of characters for this string is: `1`

## endpoints

Specifies external endpoints that the distributor node will connect to

`endpoints`

*   is required

*   Type: `object` ([Details](definition-properties-endpoints.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-endpoints.md "https://joystream.org/schemas/argus/config#/properties/endpoints")

### endpoints Type

`object` ([Details](definition-properties-endpoints.md))

## directories

Specifies paths where node's data will be stored

`directories`

*   is required

*   Type: `object` ([Details](definition-properties-directories.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-directories.md "https://joystream.org/schemas/argus/config#/properties/directories")

### directories Type

`object` ([Details](definition-properties-directories.md))

## logs

Specifies the logging configuration

`logs`

*   is optional

*   Type: `object` ([Details](definition-properties-logs.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-logs.md "https://joystream.org/schemas/argus/config#/properties/logs")

### logs Type

`object` ([Details](definition-properties-logs.md))

## limits

Specifies node limits w\.r.t. storage, outbound connections etc.

`limits`

*   is required

*   Type: `object` ([Details](definition-properties-limits.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-limits.md "https://joystream.org/schemas/argus/config#/properties/limits")

### limits Type

`object` ([Details](definition-properties-limits.md))

## intervals

Specifies how often periodic tasks (for example cache cleanup) are executed by the node.

`intervals`

*   is required

*   Type: `object` ([Details](definition-properties-intervals.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-intervals.md "https://joystream.org/schemas/argus/config#/properties/intervals")

### intervals Type

`object` ([Details](definition-properties-intervals.md))

## port

Distributor node http api port

`port`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-port.md "https://joystream.org/schemas/argus/config#/properties/port")

### port Type

`integer`

### port Constraints

**minimum**: the value of this number must greater than or equal to: `0`

## keys

Specifies the keys available within distributor node CLI.

`keys`

*   is required

*   Type: an array of merged types ([Details](definition-properties-keys-items.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-keys.md "https://joystream.org/schemas/argus/config#/properties/keys")

### keys Type

an array of merged types ([Details](definition-properties-keys-items.md))

### keys Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## buckets

Specifies the buckets distributed by the node

`buckets`

*   is required

*   Type: merged type ([Details](definition-properties-buckets.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-buckets.md "https://joystream.org/schemas/argus/config#/properties/buckets")

### buckets Type

merged type ([Details](definition-properties-buckets.md))

one (and only one) of

*   [Bucket ids](definition-properties-buckets-oneof-bucket-ids.md "check type definition")

*   [All buckets](definition-properties-buckets-oneof-all-buckets.md "check type definition")

## workerId

ID of the node operator (distribution working group worker)

`workerId`

*   is required

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-workerid.md "https://joystream.org/schemas/argus/config#/properties/workerId")

### workerId Type

`integer`

### workerId Constraints

**minimum**: the value of this number must greater than or equal to: `0`
