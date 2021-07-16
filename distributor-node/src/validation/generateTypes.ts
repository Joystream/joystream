import fs from 'fs'
import path from 'path'
import { compile } from 'json-schema-to-typescript'
import { configSchema } from './schemas'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierConfig = require('@joystream/prettier-config')

compile(configSchema, 'ConfigJson', { style: prettierConfig }).then((output) =>
  fs.writeFileSync(path.resolve(__dirname, '../types/generated/ConfigJson.d.ts'), output)
)
