import ClassId from "../../ClassId";
import { JoyStruct } from '../../../JoyStruct';
import { ParametrizedEntity } from "./parametrized-entity";
import { Vec } from "@polkadot/types";
import ParametrizedClassPropertyValue from "./ParametrizedClassPropertyValue";
import { SchemaId } from "../../../media";

class ParameterizedClassPropertyValues extends Vec.with(ParametrizedClassPropertyValue) {}

type ICreateEntityOperation = {
    class_id: ClassId,
};

type IUpdatePropertyValuesOperation = {
    entity_id: ParametrizedEntity,
    new_parametrized_property_values: ParameterizedClassPropertyValues
};

type IAddSchemaSupportToEntityOperation = {
    entity_id: ParametrizedEntity,
    schema_id: SchemaId,
    new_parametrized_property_values: ParameterizedClassPropertyValues
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
            entity_id: ClassId,
            new_parametrized_property_values: ParameterizedClassPropertyValues
        }, value);
    }

    get entity_id() : ParametrizedEntity {
        return this.getField('entity_id');
    }

    get property_values() : ParameterizedClassPropertyValues {
        return this.getField('new_parametrized_property_values');
    }
}

export class AddSchemaSupportToEntityOperation extends JoyStruct<IAddSchemaSupportToEntityOperation> {
    constructor (value: IAddSchemaSupportToEntityOperation) {
        super({
            entity_id: ClassId,
            schema_id: SchemaId,
            parametrized_property_values: ParameterizedClassPropertyValues
        }, value);
    }

    get entity_id() : ParametrizedEntity {
        return this.getField('entity_id');
    }

    get property_values() : ParameterizedClassPropertyValues {
        return this.getField('new_parametrized_property_values');
    }

    get schema_id() : SchemaId {
        return this.getField('schema_id');
    }
}