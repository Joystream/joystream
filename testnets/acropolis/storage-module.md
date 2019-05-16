# Storage Module

## Table Of Content

- [Design](#design)
- [Dependencies](#dependencies)
- [Name](#name)
- [Concepts](#concepts)

## Design

### Motivation

The storage module contains all runtime functionality pertaining to managing
the Joystream storage and distribution network. As such it contains information
on actors participating in the network, as well as data that should be
retrievable.

### Structure

The module is structured into several sub-modules with their own distinct
documentation:

- [Data Object Type Registry](./storage-module-data-object-type-registry.md)
- [Data Object Storage Registry](./storage-module-data-object-storage-registry.md)
- [Data Directory](./storage-module-data-directory.md)
- [Content Directory](./storage-module-content-directory.md)

## Name

`Storage`

## Dependencies

- `roles/actors`: An external module which manages staking for roles within the
  network.

## Concepts

- `DataObjectType`: a structure describing the type of data objects that can be
  stored. This is not to be confused with file types. Instead, data object
  types will be used to group files that should follow the same storage
  patterns. See the [Data Object Type Registry](./storage-module-data-object-type-registry.md)
  for details.
