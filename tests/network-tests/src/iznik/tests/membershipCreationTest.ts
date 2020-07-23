import { KeyringPair } from '@polkadot/keyring/types'
import { membershipTest } from './impl/membershipCreation'
import { Keyring, WsProvider } from '@polkadot/api'
import { initConfig } from '../utils/config'
import { setTestTimeout } from '../utils/setTestTimeout'
import tap from 'tap'
import { registerJoystreamTypes } from '@nicaea/types'
import { ApiWrapper } from '../utils/apiWrapper'
import { closeApi } from './impl/closeApi'

tap.mocha.describe('Membership creation scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const nKeyPairs: KeyringPair[] = []
  let aKeyPair: KeyringPair
  const keyring = new Keyring({ type: 'sr25519' })
  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const durationInBlocks = 7

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  setTestTimeout(apiWrapper, durationInBlocks)
  membershipTest(apiWrapper, nKeyPairs, keyring, N, paidTerms, sudoUri)
  closeApi(apiWrapper)
})
