import fs from 'fs'
import path from 'path'
import { compileFromFile } from 'json-schema-to-typescript'
// TODO: This will require publishing @joystream/prettier-config if we want to include it in joystream-js
import prettierConfig from '@joystream/prettier-config'

const SCHEMAS_LOCATION = path.join(__dirname, '../schemas')
const OUTPUT_TYPES_LOCATION = path.join(__dirname, '../types')

const SUBDIRS_INCLUDED = ['extrinsics', 'entities'] as const

async function main() {
  for (const subdirName of fs.readdirSync(SCHEMAS_LOCATION)) {
    if (!SUBDIRS_INCLUDED.includes(subdirName as any)) {
      console.log(`Subdir/filename not included: ${subdirName} - skipping...`)
      continue
    }
    const schemaSubdir = subdirName as typeof SUBDIRS_INCLUDED[number]
    for (const schemaFilename of fs.readdirSync(path.join(SCHEMAS_LOCATION, schemaSubdir))) {
      const schemaFilePath = path.join(SCHEMAS_LOCATION, schemaSubdir, schemaFilename)
      const outputFilename = schemaFilename.replace('.schema.json', '.d.ts')
      const outputFilePath = path.join(OUTPUT_TYPES_LOCATION, schemaSubdir, outputFilename)
      try {
        await compileFromFile(schemaFilePath, {
          cwd: path.join(SCHEMAS_LOCATION, schemaSubdir),
          style: prettierConfig,
        }).then((ts) => {
          fs.writeFileSync(outputFilePath, ts)
          console.log(`${outputFilePath} succesfully generated!`)
        })
      } catch (e) {
        console.log(`${outputFilePath} compilation FAILED!`)
        console.error(e)
      }
    }
  }
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
