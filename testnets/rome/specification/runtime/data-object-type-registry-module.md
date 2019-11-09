# Data Object Type Registry Module

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Design](#design)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [register_data_object_type](#register_data_object_type)
  - [update_data_object_type](#update_data_object_type)
  - [activate_data_object_type](#activate_data_object_type)
  - [deactivate_data_object_type](#deactivate_data_object_type)

## Name

`DataObjectTypeRegistry`

## Dependencies

None.

## Design

### Motivation

All stored `DataObjects` are associated with a type. This type does not describe
a file or media type, but rather how `DataObjects` of this type are to be
handled by the storage network. This information is encapsulated in the
`DataObjectType` structure, identified by a `DataObjectTypeId`.

Of course, storage nodes should still impose some constraints on how what
uploads to accept. These constraints are described by the `constraints` field
of the `DataObjectType`. There is a corresponding `constraints_version` field,
which indicates the version of the constraints specification, i.e. how to
interpret the `constraints` field.

## Concepts

See [the module documentation](../storage-module.md#concepts) for an overview.

Each `DataObjectType` contains a `constraints` field to be queried by
uploading apps, and to be enforced by storage nodes. The current version of
the `constraints_version` field is 1, and the corresponding `constraints`
field is expected to be valid JSON with the following structure:

1. The top-level entry of the JSON is an Object, not an Array.
1. Each property key corresponds to a [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml).
   Wildcard keys such as `image/*` are allowed. The wildcard `*/*` matches any
   file, and therefore becomes the default entry (see below).
1. Each property value is itself a JSON Object, specifying further constraints
   for the matching media type:
   1. A `maximum_file_size` specifies the maximum size of permitted files, in
      Bytes.

### Content Creation

For apps attempting to upload data, the choice of `DataObjectType` is a
hardcoded property. `DataObjectType` represents a *purpose*, i.e. a media cover
image or some such. The uploading app knows exactly the purpose of each file
to upload, and chooses the appropriate `DataObjectType` accordingly.

1. Read and parse the `constraints` filed of the `DataObjectType`.
1. If the file to be uploaded matches a full media type, e.g. `image/jpeg`,
   apply constraints associated with it.
1. If the above was not true, and the file to be uploaded matches a partial
   media type, e.g. `image/*`, apply constraints associated with it.
1. If the above was not true, and the file to be uploaded matches the wildcard
   media type `*/*`, apply constraints associated with it.
1. If none of the above held, the file is not permitted, and upload should not
   commence.

Applying constraints means verifying that the file to be uploaded passes the
constraints - if it would not pass, the content is rejected immediately, and none
of the following steps are executed. This effectively implements OR-chaining
of conditions from most specific to least specific matches.

Once the app has verified that data may be uploaded, it follows the steps
outlined in the [Data Directory](./data-directory.md#uploading) section of this
specification.

### Content Liaison Approval

For storage nodes acting as liaison for a data object, the same process applies.
An upload is rejected if a constraint is not passed, or no constraints for the
media type could be found.

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
