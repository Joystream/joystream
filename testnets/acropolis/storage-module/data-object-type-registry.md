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
  - [add_data_object_type_constraints](#add_data_object_type_constraints)
  - [update_data_object_type_constraints](#update_data_object_type_constraints)
  - [remove_data_object_type_constraints](#remove_data_object_type_constraints)

## Design

### Motivation

All stored `DataObjects` are associated with a type. This type does not describe
a file or media type, but rather how `DataObjects` of this type are to be
handled by the storage network. This information is encapsualted in the
`DataObjectType` structure, identified by a `DataObjectTypeId`.

Of course, storage nodes should still impose some constraints on how what
uploads to accept. These constraints are described by the
`DataObjectTypeConstraints` structure.

## Name

`DataObjectTypeRegistry`

## Dependencies

None.

## Concepts

See [the module documentation](./storage-module.md#concepts) for an overview.

Additionally:

- `DataObjectTypeConstraints` is a structure refering to exactly one
  `DataObjectType` by `DataObjectTypeId`, and a number of constraints.
  Currently, only a maximum file size constraint is implemented.

Each `DataObjectType` maps to a unique set of constraints to be queried by
uploading apps, and to be enforced by storage nodes. The exact mapping is:

1. Each `DataObjectTypeConstraints` entry maps to exactly one `DataObjectTypeId`.
1. Multiple `DataObjectTypeConstraints` may map to the same `DataObjectTypeId`.

This is to facilitate the definition of constraints for `DataObjectTypes` with
exceptions, e.g. allow all `image/*`, but allow larger file sizes for
`image/tiff`. This would be defined with two separate `DataObjectTypeConstraints`,
both refering to the same `DataObjectTypeId`.

**Content Creation**

For apps attempting to upload data, these constraints serve as the information
necessary for deciding which `DataObjectType` to pick when creating a
`DataObject`.

1. Try to find a `DataObjectTypeConstraints` structure for the exact
   [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml)
   of the file to be uploaded.
1. If none can be found, try to find a `DataObjectTypeConstraints` structure
   for the type registry. That is, if the file is of type `image/jpeg`, try
   to find an entry for `image/*` in the registry.
1. If none can be found, apply the default `DataObjectTypeConstraints`
   structure.

At each step, if a matching `DataObjectTypeConstraints` field is found, the file
to be upload *must* pass the constraints. If it does not, the file cannot be
uploaded, and no `DataObject` should be created for it. If multiple constraints
entries are found to match, select the entry with the most restrictive constraints.

If the file does pass the constraints, then the `DataObjectTypeId` in the
`DataObjectTypeConstraints` structure is to be used when creating the `DataObject`.


**Content Liaison Approval**

For storage nodes acting as liaison for a data object, the following process
applies:

1. Retrieve the `DataObjectTypeConstraints` entries for the `DataObjectTypeId`
   provided in a `DataObject`. As per above, note that there may be several
   matching constraints.
1. Of the constraints, select the most appropriate one by going from the most
   complete to the defaults as per the section above, preferring more
   restrictive constraints over less restrictive ones if there are alternatives
   at the end.

If a constraint is found and the file seems to match the described constraints,
approve the `DataObject`. Otherwise, reject it.


## State

- `FirstDataObjectTypeId`/`NextDataObjectTypeId` - handling incrementing numeric
  `DataObjectTypeIds`.

- `DataObjectTypes` - map of `DataObjectTypeId` to `DataObjectType`.

- `DataObjectTypeConstraintsRegistry` - map of IANA media types (with wildcards) to
  a vector of `DataObjectTypeConstraints` structures. The `*/*` media type refers to
  the default constraints.

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

### `add_data_object_type_constraints`

#### Payload

- implied root origin
- `media_type`: a IANA media type, optionally with wildcards
- `constraints`: a `DataObjectTypeConstraints` structure.

#### Description

Add a constraint for the given media type. Since the constraints structure
references a `DataObjectType`, the new constraints apply to this type.

#### Errors

- Origin isn't root.
- A constraint for this exact `media_type` and `DataObjectTypeId` already exists.
- The constraint specifies an invalid maximum file size (e.g. zero;
  implementation defined.)

#### Side effect(s)

- `DataObjectTypeConstraintsRegistry` is updated to contain the `constraints`
  entry for the `media_type` key.

#### Event(s)

- `DataObjectTypeConstraintsRegistryUpdated`: currently, the only reason to
  keep watch over the registry is to update a local cache of it. Listening
  to this event allows callers to invalidate the cache.

  An IANA media type payload equal to the `media_type` parameter limits how
  much of a cache might need to be invalidated.

### `update_data_object_type_constraints`

#### Payload

- implied root origin
- `media_type`: a IANA media type, optionally with wildcards
- `constraints`: a `DataObjectTypeConstraints` structure.

#### Description

Update an existing constraint for the given media type.

#### Errors

- Origin isn't root.
- A constraint for this exact `media_type` and `DataObjectTypeId` does not exist.
- The constraint specifies an invalid maximum file size (e.g. zero;

#### Side effect(s)

See `[add_data_object_type_constraints](#add_data_object_type_constraints)`.

#### Event(s)

See `[add_data_object_type_constraints](#add_data_object_type_constraints)`.

### `remove_data_object_type_constraints`

#### Payload

- implied root origin
- `media_type`: a IANA media type, optionally with wildcards
- `data_object_type_id`: the `DataObjectTypeId` for which the constraints are
  to be removed.

#### Description

Remove constraints for a given media type and `DataObjectType`.

#### Errors

- Origin isn't root.

#### Side effect(s)

- None, if the specified constraints cannot be found. There is no particular
  need to produce an error here.
- Otherwise, constraints for the given `media_type` and `DataObjectTypeId` are
  removed from `DataObjectTypeConstraintsRegistry`.

#### Event(s)

See `[add_data_object_type_constraints](#add_data_object_type_constraints)`.


