import { OperatorMetadataJson } from '../generated/OperatorMetadataJson'
import { schemas } from './schemas'

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'OperatorMetadata' ? OperatorMetadataJson : never
