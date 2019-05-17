# Storage Module - Data Directory

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)

## Design

### Motivation

The Data Object Storage Registry is where storage providers commit to storing
any given `DataObject`.

When any storage provider has accepted and stored content - whether it is the
*Liaison* or a mirror - it will create a `DataObjectStorageRelationship` entry
in the registry to indicate that it can be contacted to serve the content.

For an *available* `DataObject`, there is thus at least one, possibly many
`DataObjectStorageRelationship` entries in the runtime:

- `DataObject` indicates content that *should* exist on the network, and
  links to a *Liaison* which must have it available.
- `DataObjectStorageRelationships` indicate that content exists in a
  particular location.

`DataObjectStorageRelationship` contains an `active` flag, which indicates
whether the relationship is currently fulfillable by the storage provider.
This permits indiciating an intent to fulfil on the runtime by providing
an inactive relationship, then synchronizing content, and finally updating
the relationship when content can be served.

## Name

`DataObjectStorageRegistry`

## Dependencies

- `DataDirectory`: An external module which lists all `DataObjects` on the
  network.
