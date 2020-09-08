import ClassId from '../../ClassId'
import { ParametrizedEntity } from './parametrized-entity'
import { Vec, u16 } from '@polkadot/types'
import ParametrizedClassPropertyValue from './ParametrizedClassPropertyValue'
import { JoyStructDecorated } from '../../../common'

// TODO Rename to ParametrizedClassPropertyValue
export class ParameterizedClassPropertyValues extends Vec.with(ParametrizedClassPropertyValue) {}

export type ICreateEntityOperation = {
  class_id: ClassId
}

export type IUpdatePropertyValuesOperation = {
  entity_id: ParametrizedEntity
  parametrized_property_values: ParameterizedClassPropertyValues
}

export type IAddSchemaSupportToEntityOperation = {
  entity_id: ParametrizedEntity
  schema_id: u16
  parametrized_property_values: ParameterizedClassPropertyValues
}

export class CreateEntityOperation
  extends JoyStructDecorated({
    class_id: ClassId,
  })
  implements ICreateEntityOperation {}

export class UpdatePropertyValuesOperation
  extends JoyStructDecorated({
    entity_id: ParametrizedEntity,
    parametrized_property_values: ParameterizedClassPropertyValues,
  })
  implements IUpdatePropertyValuesOperation {}

export class AddSchemaSupportToEntityOperation
  extends JoyStructDecorated({
    entity_id: ParametrizedEntity,
    schema_id: u16,
    parametrized_property_values: ParameterizedClassPropertyValues,
  })
  implements IAddSchemaSupportToEntityOperation {
  // Additional helper
  get property_values(): ParameterizedClassPropertyValues {
    return this.parametrized_property_values
  }
}
