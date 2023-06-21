import { OperatorMetadataJson } from '../generated/OperatorMetadataJson'
import { schemas } from './schemas'

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'OperatorMetadata' ? OperatorMetadataJson : never

// Distributor Node's operational states (are part of Operator metadata)
export const NODE_OPERATIONAL_STATUS_OPTIONS = ['Normal', 'NoService', 'NoServiceFrom', 'NoServiceDuring'] as const

// convert NODE_OPERATIONAL_STATUS_OPTIONS into string literal union type
export type NodeOperationalStatus = typeof NODE_OPERATIONAL_STATUS_OPTIONS[number]
