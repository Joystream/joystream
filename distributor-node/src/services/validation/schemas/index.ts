import { ConfigJson } from '../../../types/generated/ConfigJson'
import { OperatorMetadataJson } from '../../../types/generated/OperatorMetadataJson'
import { FamilyMetadataJson } from '../../../types/generated/FamilyMetadataJson'
import { configSchema } from './configSchema'
import { familyMetadataSchema } from './familyMetadataSchema'
import { operatorMetadataSchema } from './operatorMetadataSchema'

export const schemas = {
  Config: configSchema,
  OperatorMetadata: operatorMetadataSchema,
  FamilyMetadata: familyMetadataSchema,
} as const

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'Config'
  ? ConfigJson
  : T extends 'OperatorMetadata'
  ? OperatorMetadataJson
  : T extends 'FamilyMetadata'
  ? FamilyMetadataJson
  : never

export default schemas
