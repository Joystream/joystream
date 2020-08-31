import { Enum, u16 } from '@polkadot/types';
import { CreateEntityOperation, UpdatePropertyValuesOperation, AddSchemaSupportToEntityOperation, ParameterizedClassPropertyValues } from './operations'
import ClassId from '../../ClassId';
import { ParametrizedEntity } from './parametrized-entity';

export class CreateEntity extends CreateEntityOperation {}
export class UpdatePropertyValues extends UpdatePropertyValuesOperation {}
export class AddSchemaSupportToEntity extends AddSchemaSupportToEntityOperation {}

export type OperationTypeVariant = CreateEntity | UpdatePropertyValues | AddSchemaSupportToEntity;

type OperationTypeVariantValue = {
    [typeName: string]: OperationTypeVariant;
};

export class OperationType extends Enum {
  constructor (value?: OperationTypeVariantValue, index?: number) {
    super({
        CreateEntity,
        UpdatePropertyValues,
        AddSchemaSupportToEntity,
    }, value, index);
  }

  static CreateEntity (class_id: ClassId) : OperationType {
    let value = new CreateEntity({class_id});
    return new OperationType({'CreateEntity': value });
  }

  static UpdatePropertyValues (entity_id: ParametrizedEntity, parametrized_property_values: ParameterizedClassPropertyValues) : OperationType {
    let value = new UpdatePropertyValues({
      entity_id,
      parametrized_property_values,
    });
    return new OperationType({'UpdatePropertyValues': value});
  }

  static AddSchemaSupportToEntity (entity_id: ParametrizedEntity, schema_id: u16, parametrized_property_values: ParameterizedClassPropertyValues) : OperationType {
    let value = new AddSchemaSupportToEntity({
      entity_id,
      schema_id,
      parametrized_property_values
    });
    return new OperationType({'AddSchemaSupportToEntity': value});
  }
}
