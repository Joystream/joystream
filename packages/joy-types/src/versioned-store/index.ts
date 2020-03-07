import { getTypeRegistry, u16, Text, bool as Bool } from '@polkadot/types';
import { Vec as Vector } from '@polkadot/types/codec';
import { JoyStruct } from '../JoyStruct';
import PropertyType from './PropertyType';
import PropertyValue from './PropertyValue';
import ClassId from './ClassId';
import EntityId from './EntityId';
import { camelCase, upperFirst } from 'lodash'

export {
  ClassId,
  EntityId,
  PropertyType,
  PropertyValue
}

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

  get name (): string {
    return this.getString('name');
  }

  get description (): string {
    return this.getString('description');
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

export interface ClassIdByNameMap {
  ContentLicense?: ClassId
  CurationStatus?: ClassId
  FeaturedContent?: ClassId
  Language?: ClassId
  MediaObject?: ClassId
  MusicAlbum?: ClassId
  MusicGenre?: ClassId
  MusicMood?: ClassId
  MusicTheme?: ClassId
  MusicTrack?: ClassId
  PublicationStatus?: ClassId
  Video?: ClassId
  VideoCategory?: ClassId
}

export type ClassName = keyof ClassIdByNameMap

export function unifyClassName(className: string): ClassName {
  return upperFirst(camelCase(className)) as ClassName
}

export function registerVersionedStoreTypes () {
  try {
    getTypeRegistry().register({
      InputValidationLengthConstraint,
      ClassId: 'u64',
      EntityId: 'u64',
      Class,
      Entity,
      ClassSchema,
      Property,
      PropertyType,
      PropertyValue,
      ClassPropertyValue
    });
  } catch (err) {
    console.error('Failed to register custom types of Versioned Store module', err);
  }
}
