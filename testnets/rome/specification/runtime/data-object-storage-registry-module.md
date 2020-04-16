# Data Object Storage Registry Module

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Design](#design)
- [Future TODOs](#future-todos)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)

## Name

`DataObjectStorageRegistry`

## Dependencies

- [Data Directory](./data-directory.md): A storage sub-module which lists
  all `DataObjects` on the network.

## Design

### Motivation

The Data Object Storage Registry is where storage providers commit to storing
any given `DataObject`.

When any storage provider has accepted and stored content - whether it is the
*Liaison* or a mirror - it will create a `StorageRelationship` entry
in the registry to indicate that it can be contacted to serve the content.

For an *available* `DataObject`, there is thus at least one, possibly many
`StorageRelationship` entries in the runtime:

- `DataObject` describes content that *should* exist on the network, and
  links to a *Liaison* which must have it available.
- `StorageRelationships` indicate that content exists in a
  particular location.

`StorageRelationship` contains an `available` flag, which shows
whether the relationship is currently fulfillable by the storage provider.
This permits indicating an intent to fulfil on the runtime by providing
an inactive relationship, then synchronizing content, and finally updating
the relationship when content can be served.

## State

- `StorageRelationships`: a map of `ContentId` to a vector of
  `StorageRelationship`. An empty vector means there is no
  relationship, i.e. the content is not stored.

  However, there still need to be `available` relationships in the vector. Merely
  finding *a* relationship is not sufficient to determine whether the
  content is stored somewhere on the network.

## Events

- `StorageRelationshipAdded`: a storage provider has committed to serve
  a particular content.

  The event payload consists of the `ContentId` of the content added, and
  the `AccountId` of the storage provider adding it. Note that merely
  adding a storage relationship does not mean that the content is available
  to be served.

- `StorageRelationshipAvailabilityChanged`: the given storage relationship's
  availability changed.

  The event payload consists of the `ContentId`, the storage provider's
  `AccountId`, and the storage relationship's `available` flag value.

## Dispatchable Methods

### `add_storage_relationship`

#### Payload

- The storage provider origin.
- `content_id`: The `ContentId` to add a storage relationship for.

#### Description

When a storage provider intends to store content, it calls this function
to register this intent on the chain. The `StorageRelationship` created
by this function is set to not be `available` initially.

#### Errors

- The origin is not a storage provider.
- The `ContentId` does not exist in the [Data Directory](./data-directory.md).
- There is already a `StorageRelationship` for this `ContentId` and storage
  provider `AccountId`.

#### Side effect(s)

A new, not-`available` `StorageRelationship` for the `ContentId` and storage
provider `AccountId` is added to the `StorageRelationships` state.

#### Event(s)

- `StorageRelationshipAdded`

### `set_storage_relationship_availability`

#### Payload

- The storage provider origin.
- `content_id`: The `ContentId` to modify the `StorageRelationship` for.
- `available`: a boolean flag indicating the new availability.

#### Description

When a storage provider has finished synchronizing content identified
by the `ContentId`, it can register itself as having the content available for
download. The function only modifies state if new value of the `available`
flag differs from the stored value.

#### Errors

- The origin is not a storage provider.
- The `ContentId` does not exist in the [Data Directory](./data-directory.md).
- There is no `StorageRelationship` for this `ContentId` and storage
  provider `AccountId`.

#### Side effect(s)

The `StorageRelationship` identified by the storage provider and `ContentId`
has its `available` flag set to the passed value.

#### Event(s)

- `StorageRelationshipAvailabilityChanged`
