import { u16 } from '@polkadot/types'
import {
  CreateEntityOperation,
  UpdatePropertyValuesOperation,
  AddSchemaSupportToEntityOperation,
  ParameterizedClassPropertyValues,
} from './operations'
import ClassId from '../../ClassId'
import { ParametrizedEntity } from './parametrized-entity'
import { JoyEnum } from '../../../common'
import { Registry } from '@polkadot/types/types'

export class CreateEntity extends CreateEntityOperation {}
export class UpdatePropertyValues extends UpdatePropertyValuesOperation {}
export class AddSchemaSupportToEntity extends AddSchemaSupportToEntityOperation {}

export const OperationTypeDef = {
  CreateEntity,
  UpdatePropertyValues,
  AddSchemaSupportToEntity,
} as const

export class OperationType extends JoyEnum(OperationTypeDef) {
  // TODO: Are those are worth preserving?
  static CreateEntity(registry: Registry, class_id: ClassId): OperationType {
    const value = new CreateEntity(registry, { class_id })
    return new OperationType(registry, { CreateEntity: value })
  }

  static UpdatePropertyValues(
    registry: Registry,
    entity_id: ParametrizedEntity,
    parametrized_property_values: ParameterizedClassPropertyValues
  ): OperationType {
    const value = new UpdatePropertyValues(registry, {
      entity_id,
      parametrized_property_values,
    })
    return new OperationType(registry, { UpdatePropertyValues: value })
  }

  static AddSchemaSupportToEntity(
    registry: Registry,
    entity_id: ParametrizedEntity,
    schema_id: u16,
    parametrized_property_values: ParameterizedClassPropertyValues
  ): OperationType {
    const value = new AddSchemaSupportToEntity(registry, {
      entity_id,
      schema_id,
      parametrized_property_values,
    })
    return new OperationType(registry, { AddSchemaSupportToEntity: value })
  }
}
