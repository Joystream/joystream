/*
  Legacy types from sumer runtime.

  We only add them here to make it possible for this version of the types library to be usable
  against older runtime without expectation of using these deprecated types.
  This is primarily to perform a runtime upgrade of prior runtime for example.

  Important Note: When new modules are added and happen to use type names that match the ones defined here
  make sure to remove them from this file!
*/

import { RegistryTypes } from '@polkadot/types/types'
import { Null } from '@polkadot/types'

// From "sumer" data_directory (old storage modules)
export class ContentId extends Null {}
export class ContentParameters extends Null {}
export class DataObjectStorageRelationship extends Null {}
export class DataObjectStorageRelationshipId extends Null {}
export class DataObjectType extends Null {}
export class DataObjectTypeId extends Null {}
export class NewAsset extends Null {}
export class ObjectOwner extends Null {}
export class StorageObjectOwner extends Null {}
export class UploadingStatus extends Null {}
export class VoucherLimit extends Null {}

export const legacyTypes: RegistryTypes = {
  ContentId,
  ContentParameters,
  DataObjectStorageRelationship,
  DataObjectStorageRelationshipId,
  DataObjectType,
  DataObjectTypeId,
  NewAsset,
  ObjectOwner,
  StorageObjectOwner,
  UploadingStatus,
  VoucherLimit,
}

export default legacyTypes
