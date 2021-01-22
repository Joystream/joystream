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
import { Null } from '@polkadot/types'

export class Channel extends Null {}
export class ChannelContentType extends Null {}
export class ChannelCurationStatus extends Null {}
export class ChannelId extends Null {}
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

export const legacyTypes: RegistryTypes = {
  Channel,
  ChannelContentType,
  ChannelCurationStatus,
  ChannelId,
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
}

export default legacyTypes
