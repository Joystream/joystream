import { types } from '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { getInitializationInputs } from '../src/helpers/inputs'
import fs from 'fs'
import path from 'path'
import { InputParser } from '../src/helpers/InputParser'
import { ExtrinsicsHelper, getAlicePair, getKeyFromSuri } from '../src/helpers/extrinsics'

// Save entity operations output here for easier debugging
const ENTITY_OPERATIONS_OUTPUT_PATH = path.join(__dirname, '../operations.json')

const { classInputs, schemaInputs, entityBatchInputs } = getInitializationInputs()

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })

  const LeadKeyPair = process.env.LEAD_URI ? getKeyFromSuri(process.env.LEAD_URI) : getAlicePair()

  // Emptiness check
  if ((await api.query.contentDirectory.classById.keys()).length > 0) {
    console.log('Content directory is not empty! Skipping...')
    process.exit()
  }

  const txHelper = new ExtrinsicsHelper(api)
  const parser = new InputParser(api, classInputs, schemaInputs, entityBatchInputs)

  console.log(`Initializing classes (${classInputs.length} input files found)...\n`)
  const classExtrinsics = parser.getCreateClassExntrinsics()
  await txHelper.sendAndCheck(LeadKeyPair, classExtrinsics, 'Class initialization failed!')

  console.log(`Initializing schemas (${schemaInputs.length} input files found)...\n`)
  const schemaExtrinsics = await parser.getAddSchemaExtrinsics()
  await txHelper.sendAndCheck(LeadKeyPair, schemaExtrinsics, 'Schemas initialization failed!')

  console.log(`Initializing entities (${entityBatchInputs.length} input files found)`)
  const entityOperations = await parser.getEntityBatchOperations()
  // Save operations in operations.json (for reference in case of errors)
  console.log(`Saving entity batch operations in ${ENTITY_OPERATIONS_OUTPUT_PATH}...`)
  fs.writeFileSync(
    ENTITY_OPERATIONS_OUTPUT_PATH,
    JSON.stringify(
      entityOperations.map((o) => o.toJSON()),
      null,
      4
    )
  )
  console.log(`Sending Transaction extrinsic (${entityOperations.length} operations)...`)
  await txHelper.sendAndCheck(
    LeadKeyPair,
    [api.tx.contentDirectory.transaction({ Lead: null }, entityOperations)],
    'Entity initialization failed!'
  )
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(-1)
  })
