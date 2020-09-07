import { RegistryTypes } from '@polkadot/types/types'
import common from './common'
import members from './members'
import council from './council'
import roles from './roles'
import forum from './forum'
import stake from './stake'
import mint from './mint'
import recurringRewards from './recurring-rewards'
import hiring from './hiring'
import versionedStore from './versioned-store'
import versionedStorePermissions from './versioned-store/permissions'
import contentWorkingGroup from './content-working-group'
import workingGroup from './working-group'
import discovery from './discovery'
import media from './media'
import proposals from './proposals'
import { InterfaceTypes } from '@polkadot/types/types/registry'
import { TypeRegistry } from '@polkadot/types'

export {
  common,
  members,
  council,
  roles,
  forum,
  stake,
  mint,
  recurringRewards,
  hiring,
  versionedStore,
  versionedStorePermissions,
  contentWorkingGroup,
  workingGroup,
  discovery,
  media,
  proposals,
}

export const types: RegistryTypes = {
  MemoText: 'Text', // for the memo module
  ...common,
  ...members,
  ...council,
  ...roles,
  ...forum,
  ...stake,
  ...mint,
  ...recurringRewards,
  ...hiring,
  ...versionedStore,
  ...versionedStorePermissions,
  ...contentWorkingGroup,
  ...workingGroup,
  ...discovery,
  ...media,
  ...proposals,
  // Required since migration to Substrate 2.0,
  // see: https://polkadot.js.org/api/start/FAQ.html#the-node-returns-a-could-not-convert-error-on-send
  Address: 'AccountId',
  LookupSource: 'AccountId',
}

// Allows creating types without api instance (it's not a recommended way though, so should be used just for mocks)
export const registry = new TypeRegistry()
registry.register(types)

export function createType<TypeName extends keyof InterfaceTypes>(
  type: TypeName,
  value: any
): InterfaceTypes[TypeName] {
  return registry.createType(type, value)
}
