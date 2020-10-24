import { ApiPromise } from '@polkadot/api'
import { InputParser } from './InputParser'
import { ExtrinsicsHelper } from './extrinsics'
import { KeyringPair } from '@polkadot/keyring/types'

export default async function initializeContentDir(api: ApiPromise, leadKey: KeyringPair): Promise<void> {
  const txHelper = new ExtrinsicsHelper(api)
  const parser = InputParser.createWithInitialInputs(api)

  // Initialize classes first in order to later be able to get classIdByNameMap
  const createClassTxs = await parser.getCreateClassExntrinsics()
  await txHelper.sendAndCheck(leadKey, createClassTxs, 'Classes initialization failed!')

  // Initialize schemas and entities
  const addSchemaTxs = await parser.getAddSchemaExtrinsics()
  const entitiesTx = api.tx.contentDirectory.transaction({ Lead: null }, await parser.getEntityBatchOperations())
  await txHelper.sendAndCheck(leadKey, addSchemaTxs, 'Schemas initialization failed!')
  await txHelper.sendAndCheck(leadKey, [entitiesTx], 'Entities initialization failed!')
}
