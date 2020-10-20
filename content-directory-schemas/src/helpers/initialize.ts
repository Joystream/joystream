import { ApiPromise } from '@polkadot/api'
import { InputParser } from './InputParser'
import { ExtrinsicsHelper } from './extrinsics'
import { KeyringPair } from '@polkadot/keyring/types'

export default async function initializeContentDir(api: ApiPromise, leadKey: KeyringPair): Promise<void> {
  const txHelper = new ExtrinsicsHelper(api)
  const parser = InputParser.createWithInitialInputs(api)
  const extrinsics = await parser.getAllExtrinsics()
  await txHelper.sendAndCheck(leadKey, extrinsics, 'Content directory initialization failed!')
}
