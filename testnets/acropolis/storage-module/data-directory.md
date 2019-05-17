# Storage Module - Data Directory

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)

## Design

### Motivation

The Data Directory is used to manage what data exists on the network. As such,
it contains a complete list of all accessible content; each file uploaded to
any storage node requires an entry in the data directory, in the form of a
`DataObject`. These `DataObjects` are identified via a unique `DataObjectId`.

It also links to the [Data Object Type Registry](./data-object-type-registry.md),
permitting all participating apps (consuming apps or storage node) to negotiate
whether content may be uploaded.

**Uploading**

The simplified workflow for uploading content is as follows:

1. Select an appropriate `DataObjectType` from the *Data Object Type Registry*.
2. Create a `DataObject` linking to the selected `DataObjectType`. The
  `DataObject` is not initially active.
3. The runtime will select a *Liaison*, a storage node that must handle
   the upload.
4. Contact the *Liaison* for upload. The *Liaison* will accept or reject
   the upload depending on whether the uploaded data fulfils the constraints
   placed on the `DataObjectType`. The *Liaison* will update the `DataObject`
   accordingly.
5. If the upload was accepted, the *Liaison* will also create an entry in
   the [Data Object Storage Registry](./data-object-storage-registry.md),
   indicating that the data is stored.
6. Other storage nodes may replicate the data object, and create their own
   entries in the *Data Object Storage Registry*.

**Downloading**

Any storage provider listed in the *Data Object Storage Registry* as holding
a given file can be contacted for downloads.

## Name

`DataDirectory`

## Dependencies

- `DataObjectTypeRegistry`: An external module which holds constraint
  information on data.
