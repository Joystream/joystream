import { main as pbjs } from 'protobufjs/cli/pbjs'
import { main as pbts } from 'protobufjs/cli/pbts'
import path from 'path'
import fs from 'fs'

const OUT_DIR = path.resolve(__dirname, '../compiled')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

pbjs(
  ['--target', 'static-module', '-w', 'commonjs', '-o', `${OUT_DIR}/index.js`, '--force-long', 'proto/*.proto'],
  function (err) {
    if (err) {
      throw err
    }
    console.log(`${OUT_DIR}/index.js updated`)
  }
)

pbts([`${OUT_DIR}/*.js`], function (err, output) {
  if (err) {
    throw err
  }
  // Fix missing Long import
  output = `import { Long } from 'long'\n${output}`

  fs.writeFileSync(`${OUT_DIR}/index.d.ts`, output)

  console.log(`${OUT_DIR}/index.d.ts updated`)
})
