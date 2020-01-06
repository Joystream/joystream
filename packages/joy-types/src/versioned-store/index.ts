import { getTypeRegistry, u16, Text, bool as Bool } from '@polkadot/types';
import { Vec as Vector } from '@polkadot/types/codec';
import { JoyStruct } from '../JoyStruct';
import PropertyType from './PropertyType';
import PropertyValue from './PropertyValue';
import ClassId from './ClassId';
import EntityId from './EntityId';

export type InputValidationLengthConstraintType = {
  min: u16,
  max_min_diff: u16
};

export class InputValidationLengthConstraint extends JoyStruct<InputValidationLengthConstraintType> {
  constructor (value: InputValidationLengthConstraintType) {
    super({
      min: u16,
      max_min_diff: u16
    }, value);
  }

  get min (): u16 {
    return this.getField('min');
  }

  get max_min_diff (): u16 {
    return this.getField('max_min_diff');
  }

  get max (): u16 {
    return new u16(this.min.add(this.max_min_diff));
  }
}

export type PropertyTsType = {
  prop_type: PropertyType,
  required: Bool,
  name: Text,
  description: Text
};

export class Property extends JoyStruct<PropertyTsType> {
  constructor (value: PropertyTsType) {
    super({
      prop_type: PropertyType,
      required: Bool,
      name: Text,
      description: Text
    }, value);
  }

  get prop_type (): PropertyType {
    return this.getField('prop_type');
  }

  get required (): boolean {
    return this.getBoolean('required');
  }

  get name (): string {
    return this.getString('name');
  }

  get description (): string {
    return this.getString('description');
  }
}

export class VecProperty extends Vector.with(Property) {}

export class VecU16 extends Vector.with(u16) {}

export type ClassSchemaType = {
  properties: VecU16
};

export class ClassSchema extends JoyStruct<ClassSchemaType> {
  constructor (value: ClassSchemaType) {
    super({
      properties: VecU16
    }, value);
  }

  get properties (): VecU16 {
    return this.getField('properties');
  }
}

export class VecClassSchema extends Vector.with(ClassSchema) {}

export type ClassPropertyValueType = {
  in_class_index: u16,
  value: PropertyValue
};

export class ClassPropertyValue extends JoyStruct<ClassPropertyValueType> {
  constructor (value: ClassPropertyValueType) {
    super({
      in_class_index: u16,
      value: PropertyValue
    }, value);
  }

  get in_class_index (): u16 {
    return this.getField('in_class_index');
  }

  get value (): PropertyValue {
    return this.getField('value');
  }
}

export class VecClassPropertyValue extends Vector.with(ClassPropertyValue) {}

export type ClassType = {
  id: ClassId,
  properties: VecProperty,
  schemas: VecClassSchema,
  name: Text,
  description: Text
};

export class Class extends JoyStruct<ClassType> {
  constructor (value: ClassType) {
    super({
      id: ClassId,
      properties: VecProperty,
      schemas: VecClassSchema,
      name: Text,
      description: Text
    }, value);
  }

  get id (): ClassId {
    return this.getField('id');
  }

  get properties (): VecProperty {
    return this.getField('properties');
  }

  get schemas (): VecClassSchema {
    return this.getField('schemas');
  }

  get name (): Text {
    return this.getField('name');
  }

  get description (): Text {
    return this.getField('description');
  }
}

export type EntityType = {
  id: EntityId,
  class_id: ClassId,
  in_class_schema_indexes: VecU16,
  values: VecClassPropertyValue
};

export class Entity extends JoyStruct<EntityType> {
  constructor (value: EntityType) {
    super({
      id: EntityId,
      class_id: ClassId,
      in_class_schema_indexes: VecU16,
      values: VecClassPropertyValue
    }, value);
  }

  get id (): EntityId {
    return this.getField('id');
  }

  get class_id (): ClassId {
    return this.getField('class_id');
  }

  get in_class_schema_indexes (): VecU16 {
    return this.getField('in_class_schema_indexes');
  }

  /** NOTE: Renamed to `entity_values` because `values` is already in use. */
  get entity_values (): VecClassPropertyValue {
    return this.getField('values');
  }
}

// type ProptyIndexAndType = {
//   index: number,
//   type: string
// }

type SubstrateEntity = {
  [propName: string]: PropertyValue
};

export class EntityCodec {
  
  klass: Class;
  propNameToIndexMap: Map<string, number> = new Map();
  propIndexToNameMap: Map<number, string> = new Map();
  
  constructor (klass: Class) {
    this.klass = klass;
    klass.properties.map((p, idx) => {
      const propName = p.name.toString();
      this.propNameToIndexMap.set(propName, idx);
      this.propIndexToNameMap.set(idx, propName);
    })
  }

  toSubstrateObject<T extends SubstrateEntity> (entity: Entity): T | undefined {
    let res = {} as T;
    entity.entity_values.forEach(v => {
      const propIdx = v.in_class_index.toNumber();
      const propName = this.propIndexToNameMap.get(propIdx);
      if (propName) {
        (res[propName] as any) = v.value;
      }
    });
    return res;
  }

  toPlainObject<T = {}> (entity: Entity): T | undefined {
    let res = {} as T;
    const propToValue = this.toSubstrateObject<any>(entity);

    // TODO continue...
    
    return res;
  }
}

const toPlainEntity = (se: Entity) => {
  const pe = {};
  se.entity_values.forEach(v => {
    v.value.type
  });
  return pe;
}

export function registerVersionedStoreTypes () {
  try {
    getTypeRegistry().register({
      InputValidationLengthConstraint,
      ClassId,
      EntityId,
      Class,
      Entity,
      ClassSchema,
      Property,
      PropertyType,
      PropertyValue,
      ClassPropertyValue
    });
  } catch (err) {
    console.error('Failed to register custom types of versioned store module', err);
  }
}
