import { KeyringPair } from '@polkadot/keyring/types'
import { membershipTest } from '../impl/membershipCreation'
import { councilTest } from '../impl/electingCouncil'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../impl/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { voteForProposal, workingGroupMintCapacityProposal } from './impl/proposalsModule'
import { expectMintCapacityChanged } from '../workingGroup/impl/workingGroupModule'

tap.mocha.describe('Set storage working group mint capacity scenario', async () => {
  initConfig()
  registerJoystreamTypes()

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
  const mintCapacityIncrement: BN = new BN(process.env.MINT_CAPACITY_INCREMENT!)
  const durationInBlocks = 30

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  setTestTimeout(apiWrapper, durationInBlocks)
  membershipTest(apiWrapper, m1KeyPairs, keyring, N, paidTerms, sudoUri)
  membershipTest(apiWrapper, m2KeyPairs, keyring, N, paidTerms, sudoUri)
  councilTest(apiWrapper, m1KeyPairs, m2KeyPairs, keyring, K, sudoUri, greaterStake, lesserStake)

  let mintCapacityProposalId: BN
  const newMintCapacity: BN = (await apiWrapper.getWorkingGroupMintCapacity(WorkingGroups.StorageWorkingGroup)).add(
    mintCapacityIncrement
  )
  tap.test(
    'Propose mint capacity',
    async () =>
      (mintCapacityProposalId = await workingGroupMintCapacityProposal(
        apiWrapper,
        m1KeyPairs,
        sudo,
        newMintCapacity,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve mint capacity', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, mintCapacityProposalId)
    await expectMintCapacityChanged(apiWrapper, newMintCapacity)
  })

  closeApi(apiWrapper)
})
