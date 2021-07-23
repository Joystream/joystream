import { ConfigJson } from '../../../types/generated/ConfigJson'
import { configSchema } from './configSchema'

export const schemas = {
  Config: configSchema,
} as const

export type SchemaKey = keyof typeof schemas & string

export type TypeBySchemaKey<T extends SchemaKey> = T extends 'Config' ? ConfigJson : never

export default schemas
