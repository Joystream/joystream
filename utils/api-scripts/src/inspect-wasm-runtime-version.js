#!/usr/bin/env node

// Run script with: node src/inspect-wasm-runtime-version.js ./runtime.wasm
const fs = require('fs')
const { decompress } = require('@mongodb-js/zstd')
const { getRuntimeVersionFromWasm } = require('./helpers/runtimeVersion')

// Reference from substrate:
// https://github.com/paritytech/substrate/blob/master/primitives/maybe-compressed-blob/src/lib.rs
const ZSTD_PREFIX = Buffer.from([82, 188, 83, 118, 70, 219, 142, 5])

function hasMagicPrefix(blob) {
  const prefix = blob.subarray(0, 8)
  return Buffer.compare(prefix, ZSTD_PREFIX) === 0
}

async function main() {
  const inputWasmFilePath = process.argv[2] || 'runtime.wasm'

  let wasm = fs.readFileSync(inputWasmFilePath)

  if (hasMagicPrefix(wasm)) {
    console.error('Decompressing WASM blob')
    wasm = await decompress(Buffer.from(wasm.subarray(8)))
  }

  if (!WebAssembly.validate(wasm)) {
    return console.error('Input wasm is not valid')
  }

  const runtimeVersion = await getRuntimeVersionFromWasm(wasm)

  console.log(runtimeVersion.toHuman())
}

main()
  .catch(console.error)
  .finally(() => process.exit())
