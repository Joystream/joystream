
# Forum Module - Data Object Type Registry

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [register_data_object_type](#register_data_object_type)
  - [update_data_object_type](#update_data_object_type)
  - [activate_data_object_type](#activate_data_object_type)
  - [deactivate_data_object_type](#deactivate_data_object_type)

## Design

### Motivation

All stored `DataObjects` are associated with a type. This type does not describe
a file or media type, but rather how `DataObjects` of this type are to be
handled by the storage network. This information is encapsualted in the
`DataObjectType` structure, identified by a `DataObjectTypeId`.

For the time being, the `DataObjectType` structure does not contain a lot of
information. However, it is intended to contain or refer to such information
in future extensions. In the meantime, `DataObjects` to be uploaded can already
refer to a `DataObjectTypeId`.

## Name

`DataObjectTypeRegistry`

## Dependencies

None.

## Concepts

See [the module documentation](./storage-module.md#concepts) for an overview.

## State

- `FirstDataObjectTypeId`/`NextDataObjectTypeId` - handling incrementing numeric
  `DataObjectTypeIds`.

- `DataObjectTypes` - map of `DataObjectTypeId` to `DataObjectType`.

## Events

Each event has the affected `DataObjectTypeId` as its payload.

- `DataObjectTypeRegistered` - a new `DataObjectType` was added to the registry.

- `DataObjectTypeUpdated` - a `DataObjectType` was modified in the registry.

## Dispatchable Methods

### `register_data_object_type`

#### Payload

- implied root origin
- `data_object_type`: the `DataObjectType` to write.

#### Description

Add a new `DataObjectType`.

#### Errors

- Origin isn't root.

#### Side effect(s)

- `NextDataObjectTypeId` incremented.
- `DataObjectTypes` contains the new `DataObjectType` under the previous
  value of `NextDataObjectTypeId`.

#### Event(s)

- `DataObjectTypeRegistered`

### `update_data_object_type`

#### Payload

- implied root origin
- `id`: the `DataObjectTypeId` to update.
- `data_object_type`: the `DataObjectType` to write.

#### Description

Update a `DataObjectType`.

#### Errors

- Origin isn't root.
- No `DataObjectType` with the given ID is currently registered.

#### Side effect(s)

- `DataObjectTypes` contains the updated `DataObjectType` under the given
  ID.

#### Event(s)

- `DataObjectTypeUpdated`

### `activate_data_object_type`

#### Payload

- implied root origin
- `id`: the `DataObjectTypeId` to update.

#### Description

Activate a `DataObjectType`. Only active `DataObjectTypes` can be used for
uploading new `DataObjects`.

#### Errors

- Origin isn't root.
- No `DataObjectType` with the given ID is currently registered.

#### Side effect(s)

- The `DataObjectType` for the given ID is activated.

#### Event(s)

- `DataObjectTypeUpdated`

### `deactivate_data_object_type`

#### Payload

- implied root origin
- `id`: the `DataObjectTypeId` to update.

#### Description

Deactivate a `DataObjectType`. Only active `DataObjectTypes` can be used for
uploading new `DataObjects`.

#### Errors

- Origin isn't root.
- No `DataObjectType` with the given ID is currently registered.

#### Side effect(s)

- The `DataObjectType` for the given ID is deactivated.

#### Event(s)

- `DataObjectTypeUpdated`
