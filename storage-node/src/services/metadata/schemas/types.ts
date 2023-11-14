import { schemas } from './schemas'
import { OperatorMetadataJson } from '../generated/OperatorMetadataJson'

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'OperatorMetadata' ? OperatorMetadataJson : never
