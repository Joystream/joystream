import EntityPermissions from './EntityPermissions'
import { ReferenceConstraint } from './reference-constraint'
import ClassPermissionsType from './ClassPermissions'
import { Operation } from './batching/'
import { OperationType, CreateEntity, UpdatePropertyValues, AddSchemaSupportToEntity } from './batching/operation-types'
import { ParametrizedEntity } from './batching/parametrized-entity'
import { RegistryTypes } from '@polkadot/types/types'
import ParametrizedClassPropertyValue from './batching/ParametrizedClassPropertyValue'
import { ParametrizedPropertyValue } from './batching/parametrized-property-value'

export {
  EntityPermissions,
  ReferenceConstraint,
  ClassPermissionsType,
  Operation,
  OperationType,
  CreateEntity,
  UpdatePropertyValues,
  AddSchemaSupportToEntity,
  ParametrizedEntity,
  ParametrizedClassPropertyValue,
  ParametrizedPropertyValue,
}

export const versionedStorePermissionsTypes: RegistryTypes = {
  EntityPermissions,
  ReferenceConstraint,
  ClassPermissionsType,
  Operation,
  // Expose in registry for api.createType purposes:
  OperationType,
  CreateEntity,
  UpdatePropertyValues,
  AddSchemaSupportToEntity,
  ParametrizedEntity,
  ParametrizedClassPropertyValue,
  ParametrizedPropertyValue,
}

export default versionedStorePermissionsTypes
