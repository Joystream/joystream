/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'src', 'mocking', 'data', 'raw')

const randomRange = (min, max) => {
  return Math.random() * (max - min) + min
}

const saveToFile = async (object, filename) => {
  const jsonified = JSON.stringify(object, null, 2)

  const fileOutputPath = path.join(OUTPUT_DIR, filename)
  await writeFile(fileOutputPath, jsonified)
}

module.exports = {
  randomRange,
  saveToFile,
}
