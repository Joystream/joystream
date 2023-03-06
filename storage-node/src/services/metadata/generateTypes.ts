/**
 * OperatorMetadataJson file generating script.
 */

import fs from 'fs'
import path from 'path'
import { compile } from 'json-schema-to-typescript'
import { schemas } from './schemas/schemas'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierConfig = require('@joystream/prettier-config')

const OUT_DIR = path.join(__dirname, 'generated')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR)
}

Object.entries(schemas).forEach(([schemaKey, schema]) => {
  compile(schema, `${schemaKey}Json`, { style: prettierConfig }).then(
    (output) => fs.writeFileSync(path.join(OUT_DIR, `${schemaKey}Json.d.ts`), output),
    () => {
      // onReject
    }
  )
})
