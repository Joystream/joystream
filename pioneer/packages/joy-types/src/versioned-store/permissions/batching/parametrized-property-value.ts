import { Enum, u32, Vec } from '@polkadot/types';
import { PropertyValue as VersionedStorePropertyValue, PropertyValueEnumValue } from '../../PropertyValue';
import { ParametrizedEntity } from './parametrized-entity';

export class PropertyValue extends VersionedStorePropertyValue {}
export class InternalEntityJustAdded extends u32 {}
export class InternalEntityVec extends Vec.with(ParametrizedEntity) {}

export type ParametrizedPropertyValueVariant = PropertyValue | InternalEntityJustAdded | InternalEntityVec;

type ParametrizedPropertyValueType = {
    [typeName: string]: ParametrizedPropertyValueVariant;
};

export class ParametrizedPropertyValue extends Enum {
    constructor (value?: ParametrizedPropertyValueType, index?: number) {
        super({
            PropertyValue,
            InternalEntityJustAdded,
            InternalEntityVec,
        }, value, index);
    }

    static PropertyValue(value: PropertyValueEnumValue) : ParametrizedPropertyValue {
        return new ParametrizedPropertyValue({'PropertyValue': new VersionedStorePropertyValue(
            value
        )});
    }

    static InternalEntityJustAdded(index: number | u32) : ParametrizedPropertyValue {
        return new ParametrizedPropertyValue({'InternalEntityJustAdded': new InternalEntityJustAdded(
            index
        )});
    }

    static InternalEntityVec(entities: ParametrizedEntity[] | Vec<ParametrizedEntity>) : ParametrizedPropertyValue {
        return new ParametrizedPropertyValue({'InternalEntityVec': new InternalEntityVec(
            entities
        )});
    }
}