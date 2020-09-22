/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)

const OUTPUT_DIR = 'generated'

const randomRange = (min, max) => {
  return Math.random() * (max - min) + min
}

const saveToFile = async (object, filename) => {
  const jsonified = JSON.stringify(object)

  const outputPath = path.join(__dirname, OUTPUT_DIR)
  await mkdir(outputPath, { recursive: true })
  const fileOutputPath = path.join(outputPath, filename)
  await writeFile(fileOutputPath, jsonified)
}

module.exports = {
  randomRange,
  saveToFile,
}
