# Query Node Manifest

## Overview

The query node manifest specifies the extract-transform-load processes run by a query node. A query
node ingests raw events and data from a substrate chain and transforms and loads to the downstream
_sink_ sources as specified by the manifest. The manifest loosely follows the subgraph manifest of by the graph protocol.

## Top Level API

| Field  | Type | Description   |
| --- | --- | --- |
| **specVersion** | *String*   | A Semver version indicating which version of this API is being used.|
| **description** | *String* | An optional description of the substrate chain. |
| **repository**  | *String* | An optional link to where the subgraph lives. |
| **dataSources** | Data Source Spec | Each data source spec defines the data that will be ingested |
| **schema**   | [*String*] | Path to the GraphQL schema augmented with directives supporting e.g. elasticsearch indices |

## Schema

Schema is a GraphQL spec

## Data Source

| Field | Type | Description |
| --- | --- | --- |
| **kind** | *String* | The type of data source. Possible values: *substrate/index*.|
| **name** | *String* | The name of the source data. Will be used to generate APIs in the mapping and also for self-documentation purposes. |
| **network** | *String* | For blockchains, this describes which network the subgraph targets. For substrate network, this should specify substrate network name, e.g. 'joystream/constaninople' |
| **source** | [*Source*] | The source data on a substrate blockchain. |
| **startBlock** | integer | Block height to start from |

### Mapping

The `mapping` field may be one of the following supported mapping manifests:

| Field | Type | Description |
| --- | --- | --- |
| **kind** | *String* | Must be "substrate/bootstrap" for Substrate Bootstrap Mapping. |
| **apiVersion** | *String* | Semver string of the version of the Mappings API that will be used by the mapping script. |
| **language** | *String* | The language of the runtime for the Mapping API. Possible values: *wasm/assemblyscript*. |
| **file** | [*Path*](#16-path) | The path of the mapping script. |

> **Note:** Each mapping is required to supply one or more handler type, available types: `EventHandler`, `CallHandler`, `BlockHandler` or `BootHandler`.

#### BootHandler

| Field | Type | Description |
| --- | --- | --- |
| **entity** | *String* | Entity that should be loaded
| **handler** | *String* | Function name to be called

#### EventHandler

| Field | Type | Description |
| --- | --- | --- |
| **event** | *String* | An identifier for an event that will be handled in the mapping script. For Ethereum contracts, this must be the full event signature to distinguish from events that may share the same name. No alias types can be used. For example, uint will not work, uint256 must be used.|
| **handler** | *String* | The name of an exported function in the mapping script that should handle the specified event. |
| **topic0** | optional *String* | A `0x` prefixed hex string. If provided, events whose topic0 is equal to this value will be processed by the given handler. When topic0 is provided, _only_ the topic0 value will be matched, and not the hash of the event signature. This is useful for processing anonymous events in Solidity, which can have their topic0 set to anything.  By default, topic0 is equal to the hash of the event signature. |

#### CallHandler

| Field | Type | Description |
| --- | --- | --- |
| **function** | *String* | An identifier for a function that will be handled in the mapping script. For Ethereum contracts, this is the normalized function signature to filter calls by. |
| **handler** | *String* | The name of an exported function in the mapping script that should handle the specified event. |

#### BlockHandler

| Field | Type | Description |
| --- | --- | --- |
| **handler** | *String* | The name of an exported function in the mapping script that should handle the specified event. |
| **filter** | optional *String* | The name of the filter that will be applied to decide on which blocks will trigger the mapping. If none is supplied, the handler will be called on every block. |
