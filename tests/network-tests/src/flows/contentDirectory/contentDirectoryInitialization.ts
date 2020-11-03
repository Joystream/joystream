import { Api, WorkingGroups } from '../../Api'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export default async function initializeContentDirectory(api: Api, leadKeyPair: KeyringPair) {
  await api.initializeContentDirectory(leadKeyPair)
}
