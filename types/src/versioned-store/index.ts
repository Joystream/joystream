import { u16, Text, bool as Bool } from '@polkadot/types'
import { Vec as Vector } from '@polkadot/types/codec'
import EntityId from './EntityId'
import ClassId from './ClassId'
import PropertyType from './PropertyType'
import PropertyValue from './PropertyValue'
import { camelCase, upperFirst } from 'lodash'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyStructDecorated, JoyStructCustom } from '../common'

export { ClassId, EntityId, PropertyType, PropertyValue }

export type PropertyTsType = {
  prop_type: PropertyType
  required: Bool
  name: Text
  description: Text
}

export class Property extends JoyStructCustom({
  prop_type: PropertyType,
  required: Bool,
  name: Text,
  description: Text,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get prop_type(): PropertyType {
    return this.getField('prop_type')
  }

  get required(): boolean {
    return this.getField('required').valueOf()
  }

  get name(): string {
    return this.getString('name')
  }

  get description(): string {
    return this.getString('description')
  }
}

export class VecProperty extends Vector.with(Property) {}

export class VecU16 extends Vector.with(u16) {}

export type ClassSchemaType = {
  properties: VecU16
}

export class ClassSchema
  extends JoyStructDecorated({
    properties: VecU16,
  })
  implements ClassSchemaType {}

export class VecClassSchema extends Vector.with(ClassSchema) {}

export type ClassPropertyValueType = {
  in_class_index: u16
  value: PropertyValue
}

export class ClassPropertyValue
  extends JoyStructDecorated({
    in_class_index: u16,
    value: PropertyValue,
  })
  implements ClassPropertyValueType {}

export class VecClassPropertyValue extends Vector.with(ClassPropertyValue) {}

export type ClassType = {
  id: ClassId
  properties: VecProperty
  schemas: VecClassSchema
  name: Text
  description: Text
}

export class Class extends JoyStructCustom({
  id: ClassId,
  properties: VecProperty,
  schemas: VecClassSchema,
  name: Text,
  description: Text,
})
// FIXME: Make it JoyStructDecorated compatible
{
  get id(): ClassId {
    return this.getField('id')
  }

  get properties(): VecProperty {
    return this.getField('properties')
  }

  get schemas(): VecClassSchema {
    return this.getField('schemas')
  }

  get name(): string {
    return this.getString('name')
  }

  get description(): string {
    return this.getString('description')
  }
}

export type EntityType = {
  id: EntityId
  class_id: ClassId
  in_class_schema_indexes: VecU16
  values: VecClassPropertyValue
}

export class Entity extends JoyStructDecorated({
  id: EntityId,
  class_id: ClassId,
  in_class_schema_indexes: VecU16,
  values: VecClassPropertyValue,
}) {
  /** NOTE: Renamed to `entity_values` because `values` is already in use (Map's original method). */
  get entity_values(): VecClassPropertyValue {
    return this.getField('values')
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

export function unifyPropName(propName: string): string {
  return camelCase(propName)
}

export const versionedStoreTypes: RegistryTypes = {
  ClassId: 'u64',
  EntityId: 'u64',
  Class,
  Entity,
  ClassSchema,
  Property,
  PropertyType,
  PropertyValue,
  ClassPropertyValue,
}

export default versionedStoreTypes
