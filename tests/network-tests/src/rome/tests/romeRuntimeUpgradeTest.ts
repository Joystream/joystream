import { KeyringPair } from '@polkadot/keyring/types'
import { membershipTest } from './impl/membershipCreation'
import { councilTest } from './impl/electingCouncil'
import { romeRuntimeUpgradeTest } from './impl/romeRuntimeUpgrade'
import { initConfig } from '../utils/config'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { setTimeout } from './impl/setTimeout'

initConfig()

const m1KeyPairs: KeyringPair[] = []
const m2KeyPairs: KeyringPair[] = []

const keyring = new Keyring({ type: 'sr25519' })
const N: number = +process.env.MEMBERSHIP_CREATION_N!
const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
const nodeUrl: string = process.env.NODE_URL!
const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
const K: number = +process.env.COUNCIL_ELECTION_K!
const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
const proposalStake: BN = new BN(+process.env.RUNTIME_UPGRADE_PROPOSAL_STAKE!)
const runtimePath: string = process.env.RUNTIME_WASM_PATH!
const durationInBlocks = 30

setTimeout(nodeUrl, durationInBlocks)
membershipTest(m1KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri)
membershipTest(m2KeyPairs, keyring, N, paidTerms, nodeUrl, sudoUri)
councilTest(m1KeyPairs, m2KeyPairs, keyring, K, nodeUrl, sudoUri, greaterStake, lesserStake)
romeRuntimeUpgradeTest(m1KeyPairs, m2KeyPairs, keyring, nodeUrl, sudoUri, proposalStake, runtimePath)
