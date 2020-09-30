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
import _ from 'lodash'
import { schemaFilenameToEntitySchemaName, classIdToEntitySchemaName } from './helpers/entitySchemas'

import PRIMITIVE_PROPERTY_DEFS from '../schemas/propertyValidationDefs.schema.json'
import { getInputsLocation } from './helpers/inputs'

const INPUTS_LOCATION = getInputsLocation('schemas')
const SINGLE_ENTITY_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entities')
const BATCH_OF_ENITIES_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entityBatches')
const ENTITY_REFERENCE_SCHEMAS_LOCATION = path.join(__dirname, '../schemas/entityReferences')

const inputFilenames = fs.readdirSync(INPUTS_LOCATION)

const strictObjectDef = (def: Record<string, any>) => ({
  type: 'object',
  additionalProperties: false,
  ...def,
})

const onePropertyObjectDef = (propertyName: string, propertyDef: Record<string, any>) =>
  strictObjectDef({
    required: [propertyName],
    properties: {
      [propertyName]: propertyDef,
    },
  })

const TextPropertyDef = ({ Text: maxLength }: TextProperty) => ({
  type: 'string',
  maxLength,
})

const HashPropertyDef = ({ Hash: maxLength }: HashProperty) => ({
  type: 'string',
  maxLength,
})

const ReferencePropertyDef = ({ Reference: ref }: ReferenceProperty) => ({
  'oneOf': [
    onePropertyObjectDef('new', { '$ref': `./${classIdToEntitySchemaName(ref[0], 'Entity')}.schema.json` }),
    onePropertyObjectDef('existing', {
      '$ref': `../entityReferences/${classIdToEntitySchemaName(ref[0], 'Ref')}.schema.json`,
    }),
  ],
})

const SinglePropertyDef = ({ Single: singlePropType }: SinglePropertyVariant) => {
  if (typeof singlePropType === 'string') {
    return PRIMITIVE_PROPERTY_DEFS.definitions[singlePropType]
  } else if ((singlePropType as TextProperty).Text) {
    return TextPropertyDef(singlePropType as TextProperty)
  } else if ((singlePropType as HashProperty).Hash) {
    return HashPropertyDef(singlePropType as HashProperty)
  } else if ((singlePropType as ReferenceProperty).Reference) {
    return ReferencePropertyDef(singlePropType as ReferenceProperty)
  }

  throw new Error(`Unknown single proprty type: ${JSON.stringify(singlePropType)}`)
}

const VecPropertyDef = ({ Vector: vec }: VecPropertyVariant) => ({
  type: 'array',
  maxItems: vec.max_length,
  'items': SinglePropertyDef({ Single: vec.vec_type }),
})

const PropertyDef = ({ property_type: propertyType, description }: Property) => ({
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
inputFilenames.forEach((fileName) => {
  const inputFilePath = path.join(INPUTS_LOCATION, fileName)
  const inputJson = fs.readFileSync(inputFilePath).toString()
  const inputData = JSON.parse(inputJson) as AddClassSchema

  const schemaName = schemaFilenameToEntitySchemaName(fileName)

  if (inputData.newProperties && !inputData.existingProperties) {
    const properites = inputData.newProperties
    const propertiesObj = properites.reduce((pObj, p) => {
      pObj[p.name] = PropertyDef(p)
      return pObj
    }, {} as Record<string, ReturnType<typeof PropertyDef>>)

    const EntitySchema = {
      '$schema': 'http://json-schema.org/draft-07/schema',
      '$id': `https://joystream.org/${schemaName}Entity.schema.json`,
      'title': `${schemaName}Entity`,
      'description': `JSON schema for entities based on ${schemaName} runtime schema`,
      ...strictObjectDef({
        required: properites.filter((p) => p.required).map((p) => p.name),
        properties: propertiesObj,
      }),
    }

    const ReferenceSchema = {
      '$schema': 'http://json-schema.org/draft-07/schema',
      '$id': `https://joystream.org/${schemaName}Reference.schema.json`,
      'title': `${schemaName}Reference`,
      'description': `JSON schema for reference to ${schemaName} entity based on runtime schema`,
      'anyOf': [
        ...properites.filter((p) => p.required && p.unique).map((p) => onePropertyObjectDef(p.name, PropertyDef(p))),
        PRIMITIVE_PROPERTY_DEFS.definitions.Uint64,
      ],
    }

    const BatchSchema = {
      '$schema': 'http://json-schema.org/draft-07/schema',
      '$id': `https://joystream.org/${schemaName}Batch.schema.json`,
      'title': `${schemaName}Batch`,
      'description': `JSON schema for batch of entities based on ${schemaName} runtime schema`,
      'type': 'array',
      'items': { '$ref': `../entities/${schemaName}Entity.schema.json` },
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
