import fs from 'fs'
import path from 'path'
import {
  AddClassSchema,
  HashProperty,
  Property,
  ReferenceProperty,
  SinglePropertyVariant,
  TextProperty,
  VecPropertyVariant,
} from '../types/extrinsics/AddClassSchema'
import PRIMITIVE_PROPERTY_DEFS from '../schemas/propertyValidationDefs.schema.json'
import { getInputs } from './helpers/inputs'
import { JSONSchema7 } from 'json-schema'

const SINGLE_ENTITY_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entities')
const BATCH_OF_ENITIES_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entityBatches')
const ENTITY_REFERENCE_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entityReferences')

const schemaInputs = getInputs<AddClassSchema>('schemas')

const strictObjectDef = (def: Record<string, any>): JSONSchema7 => ({
  type: 'object',
  additionalProperties: false,
  ...def,
})

const onePropertyObjectDef = (propertyName: string, propertyDef: Record<string, any>): JSONSchema7 =>
  strictObjectDef({
    required: [propertyName],
    properties: {
      [propertyName]: propertyDef,
    },
  })

const TextPropertyDef = ({ Text: maxLength }: TextProperty): JSONSchema7 => ({
  type: 'string',
  maxLength,
})

const HashPropertyDef = ({ Hash: maxLength }: HashProperty): JSONSchema7 => ({
  type: 'string',
  maxLength,
})

const ReferencePropertyDef = ({ Reference: ref }: ReferenceProperty): JSONSchema7 => ({
  'oneOf': [
    onePropertyObjectDef('new', { '$ref': `./${ref.className}Entity.schema.json` }),
    onePropertyObjectDef('existing', { '$ref': `../entityReferences/${ref.className}Ref.schema.json` }),
  ],
})

const SinglePropertyDef = ({ Single: singlePropType }: SinglePropertyVariant): JSONSchema7 => {
  if (typeof singlePropType === 'string') {
    return PRIMITIVE_PROPERTY_DEFS.definitions[singlePropType] as JSONSchema7
  } else if ((singlePropType as TextProperty).Text) {
    return TextPropertyDef(singlePropType as TextProperty)
  } else if ((singlePropType as HashProperty).Hash) {
    return HashPropertyDef(singlePropType as HashProperty)
  } else if ((singlePropType as ReferenceProperty).Reference) {
    return ReferencePropertyDef(singlePropType as ReferenceProperty)
  }

  throw new Error(`Unknown single proprty type: ${JSON.stringify(singlePropType)}`)
}

const VecPropertyDef = ({ Vector: vec }: VecPropertyVariant): JSONSchema7 => ({
  type: 'array',
  maxItems: vec.max_length,
  'items': SinglePropertyDef({ Single: vec.vec_type }),
})

const PropertyDef = ({ property_type: propertyType, description }: Property): JSONSchema7 => ({
  ...((propertyType as SinglePropertyVariant).Single
    ? SinglePropertyDef(propertyType as SinglePropertyVariant)
    : VecPropertyDef(propertyType as VecPropertyVariant)),
  description,
})

// Mkdir entity schemas directories if they do not exist
const entitySchemasDirs = [
  SINGLE_ENTITY_SCHEMAS_LOCATION,
  BATCH_OF_ENITIES_SCHEMAS_LOCATION,
  ENTITY_REFERENCE_SCHEMAS_LOCATION,
]
entitySchemasDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

// Run schema conversion:
schemaInputs.forEach(({ fileName, data: inputData }) => {
  const schemaName = fileName.replace('Schema.json', '')

  if (inputData.newProperties && !inputData.existingProperties) {
    const properites = inputData.newProperties
    const propertiesObj = properites.reduce((pObj, p) => {
      pObj[p.name] = PropertyDef(p)
      return pObj
    }, {} as Record<string, ReturnType<typeof PropertyDef>>)

    const EntitySchema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema',
      $id: `https://joystream.org/entities/${schemaName}Entity.schema.json`,
      title: `${schemaName}Entity`,
      description: `JSON schema for entities based on ${schemaName} runtime schema`,
      ...strictObjectDef({
        required: properites.filter((p) => p.required).map((p) => p.name),
        properties: propertiesObj,
      }),
    }

    const ReferenceSchema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema',
      $id: `https://joystream.org/entityReferences/${schemaName}Ref.schema.json`,
      title: `${schemaName}Reference`,
      description: `JSON schema for reference to ${schemaName} entity based on runtime schema`,
      anyOf: [
        ...properites.filter((p) => p.required && p.unique).map((p) => onePropertyObjectDef(p.name, PropertyDef(p))),
        PRIMITIVE_PROPERTY_DEFS.definitions.Uint64 as JSONSchema7,
      ],
    }

    const BatchSchema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema',
      $id: `https://joystream.org/entityBatches/${schemaName}Batch.schema.json`,
      title: `${schemaName}Batch`,
      description: `JSON schema for batch of entities based on ${schemaName} runtime schema`,
      ...strictObjectDef({
        required: ['className', 'entries'],
        properties: {
          className: { type: 'string' },
          entries: {
            type: 'array',
            items: { '$ref': `../entities/${schemaName}Entity.schema.json` },
          },
        },
      }),
    }

    const entitySchemaPath = path.join(SINGLE_ENTITY_SCHEMAS_LOCATION, `${schemaName}Entity.schema.json`)
    fs.writeFileSync(entitySchemaPath, JSON.stringify(EntitySchema, undefined, 4))
    console.log(`${entitySchemaPath} succesfully generated!`)

    const entityReferenceSchemaPath = path.join(ENTITY_REFERENCE_SCHEMAS_LOCATION, `${schemaName}Ref.schema.json`)
    fs.writeFileSync(entityReferenceSchemaPath, JSON.stringify(ReferenceSchema, undefined, 4))
    console.log(`${entityReferenceSchemaPath} succesfully generated!`)

    const batchOfEntitiesSchemaPath = path.join(BATCH_OF_ENITIES_SCHEMAS_LOCATION, `${schemaName}Batch.schema.json`)
    fs.writeFileSync(batchOfEntitiesSchemaPath, JSON.stringify(BatchSchema, undefined, 4))
    console.log(`${batchOfEntitiesSchemaPath} succesfully generated!`)
  } else {
    console.log('WARNING: Schemas with "existingProperties" not supported yet!')
    console.log('Skipping...')
  }
})
