import { u32 } from '@polkadot/types'
import EntityId from '../../EntityId'
import { Registry } from '@polkadot/types/types'
import { JoyEnum } from '../../../common'

export class InternalEntityJustAdded extends u32 {}
export class ExistingEntity extends EntityId {}

export const ParametrizedEntityDef = {
  InternalEntityJustAdded,
  ExistingEntity,
} as const

export class ParametrizedEntity extends JoyEnum(ParametrizedEntityDef) {
  // TODO: Are those worth preserving?
  static InternalEntityJustAdded(registry: Registry, index: u32): ParametrizedEntity {
    return new ParametrizedEntity(registry, { InternalEntityJustAdded: new InternalEntityJustAdded(registry, index) })
  }

  static ExistingEntity(registry: Registry, entity_id: EntityId): ParametrizedEntity {
    return new ParametrizedEntity(registry, { ExistingEntity: new ExistingEntity(registry, entity_id) })
  }
}
