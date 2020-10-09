import path from 'path'

export const SCHEMAS_LOCATION = path.join(__dirname, '../../schemas')
export const SCHEMA_TYPES = ['entities', 'entityBatches', 'entityReferences', 'extrinsics'] as const

export type SchemaType = typeof SCHEMA_TYPES[number]

export const getSchemasLocation = (schemaType: SchemaType) => path.join(SCHEMAS_LOCATION, schemaType)
