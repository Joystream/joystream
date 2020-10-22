import { Api, WorkingGroups } from '../../Api'
import { createSimpleChannelFixture } from '../../fixtures/contentDirectoryModule'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export default async function initializeContentDirectory(api: Api, leadKeyPair: KeyringPair) {
    await api.initializeContentDirectory(leadKeyPair)
}