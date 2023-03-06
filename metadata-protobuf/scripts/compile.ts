import { main as pbjs } from 'protobufjs/cli/pbjs'
import { main as pbts } from 'protobufjs/cli/pbts'
import path from 'path'
import fs from 'fs'

const MODULE_OUT_DIR = path.resolve(__dirname, '../compiled')
const JSON_OUT_DIR = path.resolve(__dirname, '../src/json')

if (!fs.existsSync(MODULE_OUT_DIR)) {
  fs.mkdirSync(MODULE_OUT_DIR)
}

if (!fs.existsSync(JSON_OUT_DIR)) {
  fs.mkdirSync(JSON_OUT_DIR)
}

pbjs(
  ['--target', 'static-module', '-w', 'commonjs', '-o', `${MODULE_OUT_DIR}/index.js`, '--force-long', 'proto/*.proto'],
  function (err) {
    if (err) {
      throw err
    }
    console.log(`${MODULE_OUT_DIR}/index.js updated`)
  }
)

pbjs(['--target', 'json', '-o', `${JSON_OUT_DIR}/messages.json`, '--force-long', 'proto/*.proto'], function (err) {
  if (err) {
    throw err
  }
  console.log(`${JSON_OUT_DIR}/messages.json updated`)
})

pbts([`${MODULE_OUT_DIR}/*.js`], function (err, output) {
  if (err) {
    throw err
  }
  // Fix missing Long import
  output = `import { Long } from 'long'\n${output}`

  fs.writeFileSync(`${MODULE_OUT_DIR}/index.d.ts`, output)

  console.log(`${MODULE_OUT_DIR}/index.d.ts updated`)
})
