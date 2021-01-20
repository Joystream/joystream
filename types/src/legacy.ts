/*
  Legacy types in Babylon runtime of unused modules:
    - version-store
    - versioned-store-permissions
    - content-working-group

  We only add them here to make it possible for this version of the types library to be usable
  against babylon runtime without expectation of using these deprecated runtime modules and their
  types, to perform a runtime upgrade of babylon for example.
  
  Important Note: When new modules are added and happen to use type names that match the ones defined here
  make sure to remove them from this file!
*/

import { RegistryTypes } from '@polkadot/types/types'

export const legacyTypes: RegistryTypes = {
  Channel: '{}',
  ChannelContentType: '{}',
  ChannelCurationStatus: '{}',
  ChannelId: '{}',
  ChannelPublicationStatus: '{}',
  CurationActor: '{}',
  Curator: '{}',
  CuratorApplication: '{}',
  CuratorApplicationId: '{}',
  CuratorApplicationIdSet: '{}',
  CuratorApplicationIdToCuratorIdMap: '{}',
  CuratorOpening: '{}',
  CuratorOpeningId: '{}',
  Lead: '{}',
  LeadId: '{}',
  OptionalText: '{}',
  Principal: '{}',
  PrincipalId: '{}',
  WorkingGroupUnstaker: '{}',
}

export default legacyTypes
