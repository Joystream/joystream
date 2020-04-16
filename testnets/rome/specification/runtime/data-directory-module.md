# Data Directory Module

## Table Of Contents

- [Name](#name)
- [Dependencies](#dependencies)
- [Design](#design)
- [State](#state)
- [Events](#events)
- [Dispatchable Methods](#dispatchable-methods)
  - [add_data_object](#add_data_object)
  - [accept_data_object](#accept_data_object)
  - [reject_data_object](#reject_data_object)

## Name

`DataDirectory`

## Dependencies

- [Data Object Type Registry](./data-object-type-registry.md): A storage
  sub-module which holds constraint information on data.

## Design

### Motivation

The Data Directory is used to manage what data exists on the network. As such,
it contains a complete list of all accessible content; each file uploaded to
any storage node requires an entry in the data directory, in the form of a
`DataObject`. These `DataObjects` are identified via a unique `DataObjectId`.

It also links to the [Data Object Type Registry](./data-object-type-registry.md),
permitting all participating apps (consuming apps or storage node) to negotiate
whether content may be uploaded.

#### Uploading

The simplified workflow for uploading content is as follows:

1. Choose a `ContentId`. The `ContentId` is a secure random Byte string,
   and will usually be represented in a [Base58](https://en.wikipedia.org/wiki/Base58)
   encoded form.
1. Select an appropriate `DataObjectType` from the *Data Object Type Registry*.
1. Verify that the file to be uploaded passes the constraints on the
   `DataObjectType`.
1. Create a `DataObject` linking to the selected `DataObjectType`. The
  `DataObject` is not initially active.
1. The runtime will select a *Liaison*, a storage node that must handle
   the upload.
1. Contact the *Liaison* for upload. The *Liaison* will accept or reject
   the upload depending on whether the uploaded data fulfils the constraints
   placed on the `DataObjectType`. The *Liaison* will update the `DataObject`
   according to its decision.
1. If the upload was accepted, the *Liaison* will also create an entry in
   the [Data Object Storage Registry](./data-object-storage-registry.md),
   indicating that the data is stored.
1. Other storage nodes may replicate the data object, and create their own
   entries in the *Data Object Storage Registry*.

#### Downloading

Any storage provider listed in the *Data Object Storage Registry* as holding
a given file can be contacted for downloads.

#### Uploading/Downloading Protocol

While the above describes the abstract protocol for up- and downloads, the
specific wire protocol are HTTP requests conforming to the most-current
[OpenAPI](https://swagger.io/specification/) specification of the storage node.

It is generated from code documentation, so not easily linked here. The API
version is currently not stable, so a `v0` namespace is specified. [The most
current API specs](https://storage-node-1.joystream.org/swagger.json) live
on Joystream's first storage node.

#### Storage Backend Metadata

Note that `DataObject` contains a `storage_metadata` and corresponding
`storage_metadata_version` object. The version determines how to interpret the
metadata field. They are maintained by the *Liaison* (and potentially other
storage providers) for managing storage backend specific metadata.

In version `1` of this metadata, it is expected that:

1. It is serialized JSON with an Object at the top level.
1. It contains an `ipfs_content_id` field specifying a content ID to map
   to when using [IPFS](https://ipfs.io/) as the backend.

#### Liaison Selection

The runtime is responsible for selecting a *Liaison* for a `DataObject`. The
*Liaison* is selected from the currently staked pool of storage providers from
any of the *tranches* configured in the [Staking](./staking.md) part of this
module, for matching `DataObjectType`.

The implication of this is that between creating a `DataObject` and uploading
data to the *Liaison*, not too much time should pass. If there is a reason for
the *Liaison* to un-stake before re-distributing the content, then the
`DataObject` cannot be uploaded, and a new `DataObject` needs to be created.


## State

- `DataObjects` - a map of `ContentId` to `DataObject`.

## Events

- `DataObjectAdded` - a new `DataObject` has been created, with `Pending`
   liaison judgement. See above for a high-level description of how
   a *Liaison* will judge whether a `DataObject` is acceptable.

   The event payload consists of the `ContentId` and the uploader's
   `AccountId`.

- `DataObjectAccepted` - the chosen *Liaison* accepted the data object.

   The event payload consists of the `ContentId` and the *Liaison*
   `AccountId`.

- `DataObjectRejected` - the chosen *Liaison* rejected the data object.

   The event payload consists of the `ContentId` and the *Liaison*
   `AccountId`.

## Dispatchable Methods

### `add_data_object`

#### Payload

- The uploader origin.
- `content_id`: The `ContentId` chosen by the uploader.
- `type_id`: The `DataObjectTypeId` chosen by the uploader.
- `size`: The file size, in Bytes.

#### Description

As one of the first steps of the upload process, the uploader will call
this function to register their intent to upload data. This also registers
the `ContentId`, making it unavailable for further upload attempts.

As part of this function, the runtime will chose an appropriate *Liaison*,
and record it in the `DataObject`.

#### Errors

- The uploader is not an active member.
- The chosen `ContentId` is already in use.
- The chosen `DataObjectType` is inactive.

#### Side effect(s)

- A `DataObject` with the given size and type is created, and registered
  under the `ContentId` in `DataObjects`.

#### Event(s)

- `DataObjectAdded`

### `accept_data_object`

#### Payload

- The *Liaison* origin.
- `content_id`: The `ContentId` of the `DataObject` to accept.

#### Description

The *Liaison* calls this function when its checks indicate that the `DataObject`
should be accepted.

#### Errors

- The provided `ContentId` was not found.
- The signing caller is not the designated *Liaison* for the `DataObject`.

#### Side effect(s)

- The `DataObject` identified by `ContentId` has their `liaison_judgement` field
  set to Accepted.

#### Event(s)

- `DataObjectAccepted`

### `reject_data_object`

#### Payload

- The *Liaison* origin.
- `content_id`: The `ContentId` of the `DataObject` to reject.

#### Description

The *Liaison* calls this function when its checks indicate that the `DataObject`
should be rejected.

#### Errors

- The provided `ContentId` was not found.
- The signing caller is not the designated *Liaison* for the `DataObject`.

#### Side effect(s)

- The `DataObject` identified by `ContentId` has their `liaison_judgement` field
  set to Rejected.

#### Event(s)

- `DataObjectRejected`
