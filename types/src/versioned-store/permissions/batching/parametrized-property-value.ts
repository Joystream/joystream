import { u32, Vec } from '@polkadot/types'
import { PropertyValue, PropertyValueEnumValue } from '../../PropertyValue'
import { ParametrizedEntity } from './parametrized-entity'
import { Registry } from '@polkadot/types/types'
import { JoyEnum } from '../../../common'

export class InternalEntityJustAdded extends u32 {}
export class InternalEntityVec extends Vec.with(ParametrizedEntity) {}

export const ParametrizedPropertyValueDef = {
  PropertyValue,
  InternalEntityJustAdded,
  InternalEntityVec,
} as const
export class ParametrizedPropertyValue extends JoyEnum(ParametrizedPropertyValueDef) {
  // TODO: Are those worth preserving?
  static PropertyValue(registry: Registry, value: PropertyValueEnumValue): ParametrizedPropertyValue {
    return new ParametrizedPropertyValue(registry, { PropertyValue: new PropertyValue(registry, value) })
  }

  static InternalEntityJustAdded(registry: Registry, index: number | u32): ParametrizedPropertyValue {
    return new ParametrizedPropertyValue(registry, {
      InternalEntityJustAdded: new InternalEntityJustAdded(registry, index),
    })
  }

  static InternalEntityVec(
    registry: Registry,
    entities: ParametrizedEntity[] | Vec<ParametrizedEntity>
  ): ParametrizedPropertyValue {
    return new ParametrizedPropertyValue(registry, { InternalEntityVec: new InternalEntityVec(registry, entities) })
  }
}
