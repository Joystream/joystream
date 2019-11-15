import { Enum, u32 } from '@polkadot/types';
import EntityId from '../../EntityId';

export class InternalEntityJustAdded extends u32 {}
export class ExistingEntity extends EntityId {}

export type ParametrizedEntityVariant = InternalEntityJustAdded | ExistingEntity;

type ParametrizedEntityValue = {
    [typeName: string]: ParametrizedEntityVariant;
};

export class ParametrizedEntity extends Enum {
  constructor (value?: ParametrizedEntityValue, index?: number) {
    super({
        InternalEntityJustAdded,
        ExistingEntity,
    }, value, index);
  }
}
