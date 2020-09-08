import { KeyringPair } from '@polkadot/keyring/types'
import { membershipTest } from './impl/membershipCreation'
import { Keyring } from '@polkadot/api'
import { initConfig } from '../utils/config'
import { setTimeout } from './impl/setTimeout'

initConfig()

const nKeyPairs: KeyringPair[] = []

const keyring = new Keyring({ type: 'sr25519' })
const N: number = +process.env.MEMBERSHIP_CREATION_N!
const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
const nodeUrl: string = process.env.NODE_URL!
const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
const durationInBlocks = 7

setTimeout(nodeUrl, durationInBlocks)
membershipTest(nKeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri)
