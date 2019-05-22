# Storage Module - Content Directory

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)

## Design

### Motivation

Once data is stored on the network, it must be made discoverable. Part of this
is to assign meaning to any stored data. For these purposes, the Content
Directory is introduced.

The Content Directory is a list of `ContentMetadata` entries on the runtime.
Each `ContentMetadata` entry can:

- Contain a JSON payload conforming to a schema identified by a `SchemaId`.
- Contain a list of `ContentId` as children of the entry.

As `ContentMetadata` is itself identified by a `ContentId`, it is inextricably
linked to a `DataObject` with the same identifier, and intended to describe
this object.

Therefore the runtime enforces that for any `ContentMetadata`:

1. A `DataObject` with the same `ContentId` exists.
1. An active `DataObjectStorageRelationship` for the `ContentId` exists.

Additionally, `ContentMetadata` may exist in a published or unpublished state.
Of course, nothing is entirely private on the runtime, but only published
`ContentMetadata` is intended for inclusion in content listing, searches or
other user interfaces for the *Content Directory*. Unpublished entries can
e.g. be used as drafts during the creation process.

**Hierarchy**

`ContentMetadata` may contain child content IDs, which are used to indicate
a hierarchy of content of sorts. Each child must itself have a meaning;
therefore, for each child content ID, an appropriate `ContentMetadata` entry
must also exist, with the above constraints enforced.

This means that when creating a hierarchy of `ContentMetadata`, it must be
done in a leaf-to-root order.

The purpose of creating such a hierarchy depends on the `SchemaId` used
in the root entry. Possible uses are:

* For structuring podcast/video episodes in a series.
* For providing multiple languate tracks, subtitle tracks, commentary,
  etc. for video content.
* etc.

## Name

`ContentDirectory`

## Dependencies

TBD
