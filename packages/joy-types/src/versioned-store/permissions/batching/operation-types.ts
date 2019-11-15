import { Enum } from '@polkadot/types';
import { CreateEntityOperation, UpdatePropertyValuesOperation, AddSchemaSupportToEntityOperation } from './operations'

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
}
