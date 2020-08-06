import EntityPermissions from './EntityPermissions'
import { ReferenceConstraint } from './reference-constraint'
import ClassPermissionsType from './ClassPermissions'
import { Operation } from './batching/'
import { RegistryTypes } from '@polkadot/types/types'

export { EntityPermissions, ReferenceConstraint, ClassPermissionsType, Operation }

export const versionedStorePermissionsTypes: RegistryTypes = {
  EntityPermissions,
  ReferenceConstraint,
  ClassPermissionsType,
  Operation,
}

export default versionedStorePermissionsTypes
