import { ConfigJson } from '../../../types/generated/ConfigJson'
import { OperatorMetadataJson } from '../../../types/generated/OperatorMetadataJson'
import { configSchema } from './configSchema'
import { operatorMetadataSchema } from './operatorMetadataSchema'

export const schemas = {
  Config: configSchema,
  OperatorMetadata: operatorMetadataSchema,
} as const

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'Config'
  ? ConfigJson
  : T extends 'OperatorMetadata'
  ? OperatorMetadataJson
  : never

export default schemas
