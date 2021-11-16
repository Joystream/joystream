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
| [publicApi](#publicapi)     | `object`  | Required | cannot be null | [Distributor node configuration](definition-properties-publicapi.md "https://joystream.org/schemas/argus/config#/properties/publicApi")     |
| [operatorApi](#operatorapi) | `object`  | Optional | cannot be null | [Distributor node configuration](definition-properties-operatorapi.md "https://joystream.org/schemas/argus/config#/properties/operatorApi") |
| [keys](#keys)               | `array`   | Optional | cannot be null | [Distributor node configuration](definition-properties-keys.md "https://joystream.org/schemas/argus/config#/properties/keys")               |
| [buckets](#buckets)         | `array`   | Optional | cannot be null | [Distributor node configuration](definition-properties-bucket-ids.md "https://joystream.org/schemas/argus/config#/properties/buckets")      |
| [workerId](#workerid)       | `integer` | Optional | cannot be null | [Distributor node configuration](definition-properties-workerid.md "https://joystream.org/schemas/argus/config#/properties/workerId")       |

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

## publicApi

Public api configuration

`publicApi`

*   is required

*   Type: `object` ([Details](definition-properties-publicapi.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-publicapi.md "https://joystream.org/schemas/argus/config#/properties/publicApi")

### publicApi Type

`object` ([Details](definition-properties-publicapi.md))

## operatorApi

Operator api configuration

`operatorApi`

*   is optional

*   Type: `object` ([Details](definition-properties-operatorapi.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-operatorapi.md "https://joystream.org/schemas/argus/config#/properties/operatorApi")

### operatorApi Type

`object` ([Details](definition-properties-operatorapi.md))

## keys

Specifies the keys available within distributor node CLI.

`keys`

*   is optional

*   Type: an array of merged types ([Details](definition-properties-keys-items.md))

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-keys.md "https://joystream.org/schemas/argus/config#/properties/keys")

### keys Type

an array of merged types ([Details](definition-properties-keys-items.md))

### keys Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## buckets

Set of bucket ids distributed by the node. If not specified, all buckets currently assigned to worker specified in `config.workerId` will be distributed.

`buckets`

*   is optional

*   Type: `integer[]`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-bucket-ids.md "https://joystream.org/schemas/argus/config#/properties/buckets")

### buckets Type

`integer[]`

### buckets Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

**unique items**: all items in this array must be unique. Duplicates are not allowed.

## workerId

ID of the node operator (distribution working group worker)

`workerId`

*   is optional

*   Type: `integer`

*   cannot be null

*   defined in: [Distributor node configuration](definition-properties-workerid.md "https://joystream.org/schemas/argus/config#/properties/workerId")

### workerId Type

`integer`

### workerId Constraints

**minimum**: the value of this number must greater than or equal to: `0`
