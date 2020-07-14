import ClassId from "../../ClassId";
import { JoyStruct } from '../../../common';
import { ParametrizedEntity } from "./parametrized-entity";
import { Vec, u16 } from "@polkadot/types";
import ParametrizedClassPropertyValue from "./ParametrizedClassPropertyValue";

// TODO Rename to ParametrizedClassPropertyValue
export class ParameterizedClassPropertyValues extends Vec.with(ParametrizedClassPropertyValue) {}

export type ICreateEntityOperation = {
    class_id: ClassId,
};

export type IUpdatePropertyValuesOperation = {
    entity_id: ParametrizedEntity,
    parametrized_property_values: ParameterizedClassPropertyValues
};

export type IAddSchemaSupportToEntityOperation = {
    entity_id: ParametrizedEntity,
    schema_id: u16,
    parametrized_property_values: ParameterizedClassPropertyValues
};

export class CreateEntityOperation extends JoyStruct<ICreateEntityOperation> {
    constructor (value: ICreateEntityOperation) {
        super({
            class_id: ClassId,
        }, value);
    }

    get class_id () : ClassId {
        return this.getField('class_id');
    }
}

export class UpdatePropertyValuesOperation extends JoyStruct<IUpdatePropertyValuesOperation> {
    constructor (value: IUpdatePropertyValuesOperation) {
        super({
            entity_id: ParametrizedEntity,
            parametrized_property_values: ParameterizedClassPropertyValues
        }, value);
    }

    get entity_id() : ParametrizedEntity {
        return this.getField('entity_id');
    }

    get property_values() : ParameterizedClassPropertyValues {
        return this.getField('parametrized_property_values');
    }
}

export class AddSchemaSupportToEntityOperation extends JoyStruct<IAddSchemaSupportToEntityOperation> {
    constructor (value: IAddSchemaSupportToEntityOperation) {
        super({
            entity_id: ParametrizedEntity,
            schema_id: u16,
            parametrized_property_values: ParameterizedClassPropertyValues
        }, value);
    }

    get entity_id() : ParametrizedEntity {
        return this.getField('entity_id');
    }

    get property_values() : ParameterizedClassPropertyValues {
        return this.getField('parametrized_property_values');
    }

    get schema_id() : u16 {
        return this.getField('schema_id');
    }
}