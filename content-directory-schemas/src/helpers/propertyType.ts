import {
  Property,
  ReferenceProperty,
  SinglePropertyType,
  SinglePropertyVariant,
} from '../../types/extrinsics/AddClassSchema'

type PropertyType = Property['property_type']

export function isSingle(propertyType: PropertyType): propertyType is SinglePropertyVariant {
  return (propertyType as SinglePropertyVariant).Single !== undefined
}

export function isReference(propertySubtype: SinglePropertyType): propertySubtype is ReferenceProperty {
  return (propertySubtype as ReferenceProperty).Reference !== undefined
}
