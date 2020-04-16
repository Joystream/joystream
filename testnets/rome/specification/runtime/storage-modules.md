# Storage Modules

## Table Of Contents

- [Design](#design)
- [Concepts](#concepts)
- [Architecture](#architecture)
- [Traits](#traits)

## Design

### Motivation

The storage modules contains all runtime functionality pertaining to managing
the Joystream storage and distribution network. As such it contains information
on actors participating in the network, as well as data that should be
retrievable.

### Structure

There are the following modules, with their own detailed specifications.

1. [Data Object Type Registry](data-object-type-registry-module.md):
   manages how data may be stored on the network.
2. [Data Directory](data-directory-module.md):
   manages *what* data exists on the network.
3. [Data Object Storage Registry](data-object-storage-registry-module.md):
   manages  *where* data exists on the network.
4. [Storage Staking](storage-staking-module.md) manages joining and leaving
   storage *tranches*.

Also related is the [Content Directory](content-directory.md), which provides
information for users to discover stored content, but it is not a proper module.

## Concepts

- `DataObjectType`: a structure describing the type of data objects that can be
  stored. This is not to be confused with file types. Instead, data object
  types will be used to group files that should follow the same storage
  patterns. See the [Data Object Type Registry](data-object-type-registry-module.md)
  for details.

- `ContentId`: a unique identifier for `DataObject` and `ContentMetadata`
  entries.

- `DataObject`: an entry in the [Data Directory](data-directory-module.md)
  describing a single piece of content in the network.

- `ContentMetadata`: a structure for describing content metadata in a
  hierarchical fashion. Refers to one or more `DataObject` entries.

- `SchemaId`: an identifier for a metadata schema. Metadata schemas are used to
  validate `ContentMetadata` entries.

- `Liaison`: the actor account that is responsible for accepting uploads for
  a `DataObject`, and making the content available to other storage nodes.

- `StorageRelationship`: an entry in the [Data Object Storage Registry](data-object-storage-registry-module.md),
  describing which actor has stored a particular `DataObject`.

- A storage provider is an `actor` who has staked for a storage tranche.

#### ContentId, DataObject, ContentMetadata

There is a somewhat strange relationship between these three concepts, as
`ContentId` identifies both `DataObject` and `ContentMetadata`.

Each `ContentId` can be thought of as a file name in a file system: it
identifies the file contents on disk (i.e. `DataObject` here), as well as some
metadata, such as file ownership, permissions, etc.

In our system, we do not manage ownership or permissions in quite this manner,
but in order to have content discoverable by humans, *do* manage descriptive
information - aka `ContentMetadata`.

The most often used term for such identifiers is a *content identifier*, hence
the `ContentId` and corresponding `ContentMetadata` names. They best reflect
the consumer's point of view, that content has a name and some information.

The `DataObject` on the other hand refers to any generic data BLOB. Rather
than introducing a `DataObjectId` and creating a 1:1 mapping between them
and `ContentIds`, the latter is simply re-used.

#### Storage Providers

Storage providers, as indicated above, are actor accounts (public keys) which
have staked for a storage tranche. The specs will treat these and storage nodes
interchangeably, which may leave the impression that the runtime stores any
information on where storage machines are to be contacted, such as IP addresses
or host names. This is not true.

At the level of abstraction of the storage module, *only* actor account IDs are
managed. It is the purpose of the [Discovery Module](discovery-module.md) to
resolve actor account IDs further to currently up-to-date contact information.

### Architecture

The basic unit of storage is a `DataObject`, for which a unique `ContentId` is
entered into the `DataDirectory`. Each `DataObject` is associated with a
`DataObjectType`, which describes storage parameters such as maximum permissible
file sizes, etc.

For each `DataObject`, one storage provider acts as the `Liaison`, accepting and
validating the actual content upload, and making the content available to other
storage providers. The `Liaison` and any other storage provider that holds the
content available enters this fact into the runtime as a
`StorageRelationship`.

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

## Traits

<!-- This section must be reworked and renamed, we dont ahve this in standard. -->

Most of the storage module's sub-modules only make use of each other, so
there is not much need for documenting traits as interfaces between them.
However, one public trait, to be used by the related [Content Directory](content-directory.md)
does exist:

- `DataObjectHasActiveStorageRelationships`: implements a method
  `has_active_storage_relationships(content_id)` that returns true if there
  exist active `StorageRelationship` entries, and false otherwise.
