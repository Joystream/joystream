import { CreateClass } from '../types/extrinsics/CreateClass'
import { AddClassSchema } from '../types/extrinsics/AddClassSchema'
import { types } from '@joystream/types'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { JoyBTreeSet } from '@joystream/types/common'
import { PropertyId } from '@joystream/types/content-directory'
import { getInputs } from './helpers/inputs'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { EntityBatchesParser } from './helpers/EntityBatchParser'
import fs from 'fs'
import path from 'path'

type DescribedExtrinsic = {
  type: string
  inputFilename: string
  tx: SubmittableExtrinsic<'promise'>
}

// Classes
const classInputs = getInputs<CreateClass>('classes')
const schemaInputs = getInputs<AddClassSchema>('schemas')
const entityBatchInputs = getInputs('entityBatches')

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider, types })
  // Init ALICE keypair
  const keyring = new Keyring({ type: 'sr25519' })
  keyring.addFromUri('//Alice', { name: 'Alice' })
  const ALICE = keyring.getPairs()[0]

  // Emptiness check
  if ((await api.query.contentDirectory.nextClassId()).toNumber() > 1) {
    console.log('Content directory is not empty! Skipping...')
    process.exit()
  }

  const classExtrinsics = classInputs.map(({ data, fileName }) => ({
    type: 'CreateClass',
    inputFilename: fileName,
    tx: api.tx.contentDirectory.createClass(
      data.name,
      data.description,
      data.class_permissions || {},
      data.maximum_entities_count,
      data.default_entity_creation_voucher_upper_bound
    ),
  }))
  // Schemas
  const schemaExtrinsics = schemaInputs.map(({ data, fileName }) => ({
    type: 'AddClassSchema',
    inputFilename: fileName,
    tx: api.tx.contentDirectory.addClassSchema(
      data.classId,
      new (JoyBTreeSet(PropertyId))(api.registry, data.existingProperties),
      data.newProperties || []
    ),
  }))

  let nonce = (await api.query.system.account(ALICE.address)).nonce.toNumber()
  console.log('Initializing classes and schemas...\n')
  const extrinsics: DescribedExtrinsic[] = [...classExtrinsics, ...schemaExtrinsics]
  for (const { type, inputFilename, tx } of extrinsics) {
    console.log(`Sending ${type} extrinsic based on input file: ${inputFilename}`)
    await tx.signAndSend(ALICE, { nonce: nonce++ })
  }

  console.log('Initializing entities...\n')
  // Entity batches
  const entityBatchParser = new EntityBatchesParser(schemaInputs, entityBatchInputs)
  console.log('Parsing input into operations...')
  const operations = entityBatchParser.getOperations()
  // Save operations in operations.json (for reference in case of errors)
  const outputPath = path.join(__dirname, '../operations.json')
  console.log(`Saving entity batch operations in ${outputPath}...`)
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      operations.map((o) => o.toJSON()),
      null,
      4
    )
  )
  console.log('Sending Transaction extrinsic...')
  await api.tx.contentDirectory.transaction({ Lead: null }, operations).signAndSend(ALICE, { nonce: nonce++ })
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
