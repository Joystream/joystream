import { Api } from '../../Api'
import { KeyringPair } from '@polkadot/keyring/types'
import Debugger from 'debug'
const debug = Debugger('initializeContentDirectory')

export default async function initializeContentDirectory(api: Api, leadKeyPair: KeyringPair): Promise<void> {
  debug('Started')
  await api.initializeContentDirectory(leadKeyPair)
  debug('Done')
}
