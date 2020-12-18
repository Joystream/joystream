import { Api } from '../../Api'
import { KeyringPair } from '@polkadot/keyring/types'

export default async function initializeContentDirectory(api: Api, leadKeyPair: KeyringPair): Promise<void> {
  return api.initializeContentDirectory(leadKeyPair)
}
