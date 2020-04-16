# Migration Module

## Table of Contents

- [Design](#design)
- [Name](#name)
- [Dependencies](#dependencies)
- [Concepts](#concepts)
- [State](#state)
- [Events](#events)
- [on_initialize](#on_initialize)

## Design

### Motivation

The purpose of this module is to run migration routines required in the upgrading from Athens to Acropolis network through an on-chain runtime upgrade.

### Function

Routines run when the `on_initialize` dispatchable is invoked. In the upgrade to Acropolis there are no other modules which have similar code in their own handler of this callback which depend on the migration having being executed. This means it is immaterial in what order the migration module is invoked, however in the future care must be made to guarantee the migration module running first.

## Name

`Migration`

## Dependencies

 - [Data Directory Module](./substrate-runtime/data-directory-module.md)

 - [Data Object Storage Registry Module](./substrate-runtime/data-object-storage-registry.md)

 - [Sudo SRML Module](#)

## Concepts

Standard.

## State

- `SpecVersion`: If set, what runtime spec version the store was initialised, otherwise not set.

## Events

- `Migrated`: Runtime migration code was executed
  - block number of migration
  - spec version

## on_initialize

### Description

Pre-block execution code which actually performs migration and initialization under suitable conditions, namely

- `SpecVersion` is not set, which would possibly be the case from genesis
- `SpecVersion` is less than the runtime [spec version](../README.md#runtime-version)

### Event(s)

- `Migrated`

### Side effect(s)

- `SpecVersion` is set to [spec version](../README.md#runtime-version).

#### Forum

- `NextCategoryId` is `1`
- `NextThreadId` is `1`
- `NextPostId` is `1`
- `ForumSudo` is `key` in `Sudo` module.
- `CategoryTitleConstraint` is `(10,90)`
- `CategoryDescriptionConstraint` is `(10, 490)`
- `ThreadTitleConstraint` is `(10, 90)`
- `PostTextConstraint` is `(10, 990)`
- `ThreadModerationRationaleConstraint` is `(10, 290)`
- `PostModerationRationaleConstraint` is `(10, 290)`

#### DataDirectory

- `PrimaryLiaisonAccountId` is gone.
- `KnownContentIds`, `DataObjectByContentId` and `MetadataByContentId` are all empty.

#### DataObjectStorageRegirstry

- `RelationshipsByContentId` is empty.
