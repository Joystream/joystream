import fs from 'fs'
import path from 'path'
import { compile } from 'json-schema-to-typescript'
import { schemas } from '..'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierConfig = require('@joystream/prettier-config')

const OUT_DIR = path.resolve(__dirname, `../../types/generated`)

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR)
}

Object.entries(schemas).forEach(([schemaKey, schema]) => {
  compile(schema, `${schemaKey}Json`, {
    style: prettierConfig,
    ignoreMinAndMaxItems: true,
  })
    .then((output) => fs.writeFileSync(path.join(OUT_DIR, `${schemaKey}Json.d.ts`), output))
    .catch(console.error)
})
