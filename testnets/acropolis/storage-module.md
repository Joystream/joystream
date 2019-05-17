# Storage Module

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)
- [Architecture](#architecture)

## Design

### Motivation

The storage module contains all runtime functionality pertaining to managing
the Joystream storage and distribution network. As such it contains information
on actors participating in the network, as well as data that should be
retrievable.

### Structure

The module is structured into several sub-modules with their own distinct
documentation:

1. [Data Object Type Registry](./storage-module/data-object-type-registry.md):
   manages how data may be stored on the network.
1. [Data Directory](./storage-module/data-directory.md):
   manages *what* data exists on the network.
1. [Data Object Storage Registry](./storage-module/data-object-storage-registry.md):
   manages  *where* data exists on the network.
1. [Content Directory](./storage-module/content-directory.md'):
   explains how to interpret data stored on the network.

## Name

`Storage`

## Dependencies

- `roles/actors`: An external module which manages staking for roles within the
  network.

## Concepts

- `DataObjectType`: a structure describing the type of data objects that can be
  stored. This is not to be confused with file types. Instead, data object
  types will be used to group files that should follow the same storage
  patterns. See the [Data Object Type Registry](./storage-module/data-object-type-registry.md)
  for details.

- `DataObjectTypeConstraints`: a structure imposing constraints on `DataObjects`
  to be added for a given `DataObjectType`. Here, you will constraints such as
  media types or file sizes, etc.

- `ContentId`: a unique identifier for `DataObject` and `ContentMetadata`
  entries.

- `DataObject`: an entry in the [Data Directory](./storage-module/data-directory.md)
  describing a single piece of content in the network.

- `ContentMetadata`: a structure for describing content metadata in a
  hierarchical fashion. Refers to one or more `DataObject` entries.

- `SchemaId`: an identifier for a metadata schema. Metadata schemas are used to
  validate `ContentMetadata` entries.

- `Liaison`: the actor account that is responsible for accepting uploads for
  a `DataObject`, and making the content available to other storage nodes.

- `DataObjectStorageRelationship`: an entry in the [Data Object Storage Registry](./storage-module/data-object-storage-registry.md),
  describing which actor has stored a particular `DataObject`.

- A storage provider is an `actor` who has staked for the Storage role via the
  `storage/actors` module.

### Architecture

The basic unit of storage is a `DataObject`, for which a unique `ContentId` is
entered into the `DataDirectory`. Each `DataObject` is associated with a
`DataObjectType`, which describes storage parameters such as maximum permissible
file sizes, etc.

For each `DataObject`, one storage provider acts as the `Liaison`, accepting and
validating the actual content upload, and making the content available to other
storage providers. The `Liaison` and any other storage provider that holds the
content available enters this fact into the runtime as a
`DataObjectStorageRelationship`.

For purposes of content discovery, `ContentMetadata` is added to the runtime.
Each `ContentMetadata` is identified by a `ContentId`; that is, one `ContentId`
usually maps to a `DataObject` and a `ContentMetadata` entry. The
`ContentMetadata` has a JSON payload, and a `SchemaId` indicating to clients how
are to interpret the payload.

`ContentMetadata` *can* be used hierarchically. Each entry can have any number
of `ContentId` as children. These child IDs can be used to store `DataObject`
and/or `ContentMetadata` entries of their own, allowing for organizing
`DataObject` entries into hierarchical structures, e.g. for:

- Podcast episodes in a Podcast
- Series episodes in a video series
- Individual language audio files for translated videos, or subtitle texts.
- etc.

The runtime imposes no restrictions on how `SchemaId` is to be used; however,
the intent is to eventually add a schema registry that stores e.g.
[well documented schemas](https://schema.org), or some Joystream specific
derivates.
