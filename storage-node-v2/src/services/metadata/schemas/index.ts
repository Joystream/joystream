import { OperatorMetadataJson } from '../generated/OperatorMetadataJson'
import { operatorMetadataSchema } from './operatorMetadataSchema'

export const schemas = {
  OperatorMetadata: operatorMetadataSchema,
} as const

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'OperatorMetadata' ? OperatorMetadataJson : never

export default schemas
