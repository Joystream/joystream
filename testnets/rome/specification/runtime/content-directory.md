# Content Directory

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Design](#design)
- [Future TODOs](#future-todos)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [add_metadata](#add_metadata)
  - [update_metadata](#update_metadata)

## Name

`ContentDirectory`

## Dependencies

- The [Storage System](storage-system.md).

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
1. An active `StorageRelationship` for the `ContentId` exists.

Additionally, `ContentMetadata` may exist in a published or unpublished state.
Of course, nothing is entirely private on the runtime, but only published
`ContentMetadata` is intended for inclusion in content listing, searches or
other user interfaces for the *Content Directory*. Unpublished entries can
e.g. be used as drafts during the creation process.

#### Hierarchy

`ContentMetadata` may contain child content IDs, which are used to indicate
a hierarchy of content of sorts. Each child must itself have a meaning;
therefore, for each child content ID, an appropriate `ContentMetadata` entry
must also exist, with the above constraints enforced.

This means that when creating a hierarchy of `ContentMetadata`, it must be
done in a leaf-to-root order.

The purpose of creating such a hierarchy depends on the `SchemaId` used
in the root entry. Possible uses are:

* For structuring podcast/video episodes in a series.
* For providing multiple  language tracks, subtitle tracks, commentary,
  etc. for video content.
* etc.

**Hierarchy and Publishing**

Note in particular that in hierarchically structured content, the published
state may be interpreted differently depending on whether the metadata
describes a root, branch or leaf element, and on the metadata schema.

Largely, it is the published state of *root* entries that determines whether
content is discoverable at all. For branch or leaf elements, the flag may
be ignored - but such a decision is outside the scope of this document, and
belongs in a description of schemata to be used.

For example, in episodic content like a podcast, the root level element may
describe the podcast series, and contain:

1. Image `DataObjects`, for describing the podcast. These may be considered
   to be published if the root element itself is published.
1. Episode `DataObjects`, each of which may stay in a draft state until
   it is finalized. Here, the published flag should be interpreted.

Using schema identifiers in `ContentMetadata` permits easy decision making
in rendering or indexing apps as to how the hierarchy should be interpreted.

#### Content Creation

The content creation protocol is as follows:

1. Create one (or several related) `DataObjects` as described in the
  [Data Directory](./storage-module/data-directory.md) section of the
  [Storage Module](./storage-module.md).
1. Create appropriate `ContentMetadata` entries in a leaf-to-root order
  in the `ContentDirectory`.
1. Publish the root `ContentMetadata` (see the [Hierarchy](#hierarchy)
  section) to make content discoverable.

## State

- `MetadataByContentId`: a map of `ContentId` to matching `ContentMetadata`
  Objects.

- `PublishedRootContent`: a vector of published `ContentIds` that describe
  root content in a `ContentMetadata` hierarchy - in other words, the
  discoverable `ContentIds`.

  **Note:** This list should be moved off-chain once an indexing node provides
  content discovery services; it exists solely for not having to scan the entire
  `MetadataByContentId` map in the pioneer app.

## Events

- `MetadataAdded`: `ContentMetadata` has been added to `MetadataByContentId`. The
  event payload is the `ContentId` of the matching metadata.

- `MetadataUpdated`: `ContentMetadata` has been updated. The
  event payload is the `ContentId` of the matching metadata.

- `RootContentUpdated`: a `ContentMetadata` that represents root content in a
  metadata hierarchy has been updated. The payload is the `ContentId`, and a
  flag indicating whether or not this content is published.

  **Note:** This event exists to trigger updates in either pioneer's rendering
  of the content directory, or an indexing node's internal database. It's
  a special case of `MetadataUpdated` that can be listened to explicitly.

## Dispatchable Methods

### `add_metadata`

#### Payload

- The publisher origin.
- `content_id`: the `ContentId` for which the `ContentMetadata` applies.
- `data`: a `ContentMetadata` struct.
- `is_root`: a boolean flag indicating whether the metadata represents the
  root of a metadata hierarchy.

#### Description

Create a new `ContentMetadata` object for the given `ContentId`. All but
optional fields must be supplied. It is possible to set the published field
here immediately, but for hierarchical metadata that is discouraged.

#### Errors

- The origin is not an active member.
- There already exists `ContentMetadata` for this `ContentId`.
- For the given `ContentId`, the [Storage Module](./storage-module.md) does
  not have any currently active `StorageRelationship` entries, i.e. the
  content does not exist on the network.
  **Note:** it would be possible to limit this error only to situations
  in which published flag is to be set.

#### Side effect(s)

- The `ContentMetadata` struct is added under the given `ContentId` to the
  `MetadataByContentId` map.
- If the `ContentMetadata`'s published flag is set, and `is_root` is set,
  the `ContentId` is also added to `PublishedRootContent`.

#### Event(s)

- `MetadataAdded`
- If the `ContentMetadata`'s published flag is set, and `is_root` is set,
  also `RootContentUpdated` is emitted.

### `update_metadata`

#### Payload

- The publisher origin.
- `content_id`: the `ContentId` for which the `ContentMetadata` applies.
- `data`: a `ContentMetadataUpdate` struct.
- `is_root`: a boolean flag indicating whether the metadata represents the
  root of a metadata hierarchy.

#### Description

Modify an existing `ContentMetadata` for the given `ContentId`. With the
`ContentMetadataUpdate` struct, only fields to be updated must be supplied.

#### Errors

- The origin is not an active member.
- The origin is not the original creator of the `ContentMetadata`.
- There exists no `ContentMetadata` for this `ContentId`.
- For the given `ContentId`, the [Storage Module](./storage-module.md) does
  not have any currently active `StorageRelationship` entries, i.e. the
  content does not exist on the network.
  **Note:** it would be possible to limit this error only to situations
  in which published flag is to be set afterwards (aka explicitly set now,
  already set).

#### Side effect(s)

- The `ContentMetadata` struct is modified under the given `ContentId` to the
  `MetadataByContentId` map.
- If the `ContentMetadataUpdate`'s published flag is set, and `is_root` is set,
  the `ContentId` may also added to `PublishedRootContent`.

#### Event(s)

- `MetadataUpdated`
- If the `ContentMetadataUpdate`'s published flag is set, and `is_root` is set,
  also `RootContentUpdated` is emitted.
