import { jsonschema2md } from '@adobe/jsonschema2md'
import { configSchema } from '../configSchema'
import path from 'path'

console.log(configSchema)
jsonschema2md(configSchema, {
  outDir: path.resolve(__dirname, `../../../docs/schema`),
})
