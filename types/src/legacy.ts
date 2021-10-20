/*
  Legacy types in Babylon runtime of unused modules:
    - version-store
    - versioned-store-permissions
    - content-working-group
    - old 'content-directory' which is now being replaced by new 'content' module

  We only add them here to make it possible for this version of the types library to be usable
  against babylon runtime without expectation of using these deprecated runtime modules and their
  types, primarily to perform a runtime upgrade of babylon for example.

  Important Note: When new modules are added and happen to use type names that match the ones defined here
  make sure to remove them from this file!

  In the following runtime upgrade (after "Sumer" release), remove these types entierly.
*/

import { RegistryTypes } from '@polkadot/types/types'
import { Null } from '@polkadot/types'

// from: versioned-store, versioned-store permissions, content-working-group
export class ChannelContentType extends Null {}
export class ChannelCurationStatus extends Null {}
export class ChannelPublicationStatus extends Null {}
export class CurationActor extends Null {}
export class Curator extends Null {}
export class CuratorApplication extends Null {}
export class CuratorApplicationId extends Null {}
export class CuratorApplicationIdSet extends Null {}
export class CuratorApplicationIdToCuratorIdMap extends Null {}
export class CuratorOpening extends Null {}
export class CuratorOpeningId extends Null {}
export class Lead extends Null {}
export class LeadId extends Null {}
export class OptionalText extends Null {}
export class Principal extends Null {}
export class PrincipalId extends Null {}
export class WorkingGroupUnstaker extends Null {}
export class Credential extends Null {}
export class CredentialSet extends Null {}

// from: old content-directory
export class Actor extends Null {}
export class Nonce extends Null {}
export class EntityId extends Null {}
export class ClassId extends Null {}
export class VecMaxLength extends Null {}
export class TextMaxLength extends Null {}
export class HashedTextMaxLength extends Null {}
export class PropertyId extends Null {}
export class SchemaId extends Null {}
export class SameController extends Null {}
export class ClassPermissions extends Null {}
export class PropertyTypeSingle extends Null {}
export class PropertyTypeVector extends Null {}
export class PropertyType extends Null {}
export class PropertyLockingPolicy extends Null {}
export class Property extends Null {}
export class Schema extends Null {}
export class Class extends Null {}
export class EntityController extends Null {}
export class EntityPermissions extends Null {}
export class StoredValue extends Null {}
export class VecStoredValue extends Null {}
export class VecStoredPropertyValue extends Null {}
export class StoredPropertyValue extends Null {}
export class InboundReferenceCounter extends Null {}
export class Entity extends Null {}
export class EntityCreationVoucher extends Null {}
export class EntityReferenceCounterSideEffect extends Null {}
export class ReferenceCounterSideEffects extends Null {}
export class SideEffects extends Null {}
export class SideEffect extends Null {}
export class Status extends Null {}
export class InputValue extends Null {}
export class VecInputValue extends Null {}
export class InputPropertyValue extends Null {}
export class ParameterizedEntity extends Null {}
export class ParametrizedPropertyValue extends Null {}
export class ParametrizedClassPropertyValue extends Null {}
export class CreateEntityOperation extends Null {}
export class UpdatePropertyValuesOperation extends Null {}
export class AddSchemaSupportToEntityOperation extends Null {}
export class OperationType extends Null {}
export class ClassPermissionsType extends Null {}
export class ClassPropertyValue extends Null {}
export class Operation extends Null {}
export class ReferenceConstraint extends Null {}
export class InputEntityValuesMap extends Null {}
export class FailedAt extends Null {}
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

// From discovery_service
export class IPNSIdentity extends Null {}
export class ServiceProviderRecord extends Null {}

export const legacyTypes: RegistryTypes = {
  ChannelContentType,
  ChannelCurationStatus,
  ChannelPublicationStatus,
  CurationActor,
  Curator,
  CuratorApplication,
  CuratorApplicationId,
  CuratorApplicationIdSet,
  CuratorApplicationIdToCuratorIdMap,
  CuratorOpening,
  CuratorOpeningId,
  Lead,
  LeadId,
  OptionalText,
  Principal,
  PrincipalId,
  WorkingGroupUnstaker,
  Credential,
  CredentialSet,
  Nonce,
  EntityId,
  ClassId,
  VecMaxLength,
  TextMaxLength,
  HashedTextMaxLength,
  PropertyId,
  SchemaId,
  SameController,
  ClassPermissions,
  PropertyTypeSingle,
  PropertyTypeVector,
  PropertyType,
  PropertyLockingPolicy,
  Property,
  Schema,
  Class,
  ClassOf: Class,
  EntityController,
  EntityPermissions,
  StoredValue,
  VecStoredValue,
  VecStoredPropertyValue,
  StoredPropertyValue,
  InboundReferenceCounter,
  Entity,
  EntityOf: Entity,
  EntityCreationVoucher,
  Actor,
  EntityReferenceCounterSideEffect,
  ReferenceCounterSideEffects,
  SideEffects,
  SideEffect,
  Status,
  InputValue,
  VecInputValue,
  InputPropertyValue,
  ParameterizedEntity,
  ParametrizedPropertyValue,
  ParametrizedClassPropertyValue,
  CreateEntityOperation,
  UpdatePropertyValuesOperation,
  AddSchemaSupportToEntityOperation,
  OperationType,
  InputEntityValuesMap,
  ClassPermissionsType,
  ClassPropertyValue,
  Operation,
  ReferenceConstraint,
  FailedAt,
  IPNSIdentity,
  ServiceProviderRecord,
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
  VoucherLimit
}

export default legacyTypes
