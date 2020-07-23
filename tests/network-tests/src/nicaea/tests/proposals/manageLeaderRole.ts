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
import {
  createWorkingGroupLeaderOpening,
  voteForProposal,
  beginWorkingGroupLeaderApplicationReview,
  fillLeaderOpeningProposal,
  terminateLeaderRoleProposal,
  setLeaderRewardProposal,
  decreaseLeaderStakeProposal,
  slashLeaderProposal,
} from './impl/proposalsModule'
import {
  applyForOpening,
  expectLeadOpeningAdded,
  expectLeaderSet,
  expectBeganApplicationReview,
  expectLeaderRoleTerminated,
  expectLeaderRewardAmountUpdated,
  expectLeaderStakeDecreased,
  expectLeaderSlashed,
} from '../workingGroup/impl/workingGroupModule'

tap.mocha.describe('Set lead proposal scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const m1KeyPairs: KeyringPair[] = []
  const m2KeyPairs: KeyringPair[] = []
  const leadKeyPair: KeyringPair[] = []

  const keyring = new Keyring({ type: 'sr25519' })
  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const alteredPayoutAmount: BN = new BN(process.env.ALTERED_PAYOUT_AMOUNT!)
  const stakeDecrement: BN = new BN(process.env.STAKE_DECREMENT!)
  const slashAmount: BN = new BN(process.env.SLASH_AMOUNT!)
  const durationInBlocks = 70

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  setTestTimeout(apiWrapper, durationInBlocks)
  membershipTest(apiWrapper, m1KeyPairs, keyring, N, paidTerms, sudoUri)
  membershipTest(apiWrapper, m2KeyPairs, keyring, N, paidTerms, sudoUri)
  membershipTest(apiWrapper, leadKeyPair, keyring, 1, paidTerms, sudoUri)
  councilTest(apiWrapper, m1KeyPairs, m2KeyPairs, keyring, K, sudoUri, greaterStake, lesserStake)

  let createOpeningProposalId: BN
  let openingId: BN
  tap.test(
    'Propose create leader opening',
    async () =>
      (createOpeningProposalId = await createWorkingGroupLeaderOpening(
        apiWrapper,
        m1KeyPairs,
        sudo,
        applicationStake,
        roleStake,
        'Storage'
      ))
  )
  tap.test('Approve add opening proposal', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, createOpeningProposalId)
    openingId = await expectLeadOpeningAdded(apiWrapper)
  })

  tap.test(
    'Apply for lead opening',
    async () =>
      await applyForOpening(
        apiWrapper,
        leadKeyPair,
        sudo,
        applicationStake,
        roleStake,
        new BN(openingId),
        WorkingGroups.StorageWorkingGroup,
        false
      )
  )
  let beginReviewProposalId: BN
  tap.test(
    'Propose begin leader application review',
    async () =>
      (beginReviewProposalId = await beginWorkingGroupLeaderApplicationReview(
        apiWrapper,
        m1KeyPairs,
        sudo,
        new BN(openingId),
        'Storage'
      ))
  )
  tap.test('Approve begin review proposal', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, beginReviewProposalId)
    expectBeganApplicationReview(apiWrapper)
  })

  let fillLeaderOpeningProposalId: BN
  tap.test(
    'Propose fill leader opening',
    async () =>
      (fillLeaderOpeningProposalId = await fillLeaderOpeningProposal(
        apiWrapper,
        m1KeyPairs,
        leadKeyPair[0].address,
        sudo,
        firstRewardInterval,
        rewardInterval,
        payoutAmount,
        new BN(openingId),
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve fill leader opening', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, fillLeaderOpeningProposalId)
    await expectLeaderSet(apiWrapper, leadKeyPair[0].address, WorkingGroups.StorageWorkingGroup)
  })

  let rewardProposalId: BN
  tap.test(
    'Propose leader reward',
    async () =>
      (rewardProposalId = await setLeaderRewardProposal(
        apiWrapper,
        m1KeyPairs,
        sudo,
        alteredPayoutAmount,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve new leader reward', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, rewardProposalId)
    await expectLeaderRewardAmountUpdated(apiWrapper, alteredPayoutAmount, WorkingGroups.StorageWorkingGroup)
  })

  let decreaseStakeProposalId: BN
  let newStake: BN
  tap.test(
    'Propose decrease stake',
    async () =>
      (decreaseStakeProposalId = await decreaseLeaderStakeProposal(
        apiWrapper,
        m1KeyPairs,
        sudo,
        stakeDecrement,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve decreased leader stake', async () => {
    newStake = applicationStake.sub(stakeDecrement)
    voteForProposal(apiWrapper, m2KeyPairs, sudo, decreaseStakeProposalId)
    await expectLeaderStakeDecreased(apiWrapper, newStake, WorkingGroups.StorageWorkingGroup)
  })

  let slashProposalId: BN
  tap.test(
    'Propose leader slash',
    async () =>
      (slashProposalId = await slashLeaderProposal(
        apiWrapper,
        m1KeyPairs,
        sudo,
        slashAmount,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve leader slash', async () => {
    newStake = newStake.sub(slashAmount)
    voteForProposal(apiWrapper, m2KeyPairs, sudo, slashProposalId)
    await expectLeaderSlashed(apiWrapper, newStake, WorkingGroups.StorageWorkingGroup)
  })

  let terminateLeaderRoleProposalId: BN
  tap.test(
    'Propose terminate leader role',
    async () =>
      (terminateLeaderRoleProposalId = await terminateLeaderRoleProposal(
        apiWrapper,
        m1KeyPairs,
        leadKeyPair[0].address,
        sudo,
        false,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test('Approve leader role termination', async () => {
    voteForProposal(apiWrapper, m2KeyPairs, sudo, terminateLeaderRoleProposalId)
    await expectLeaderRoleTerminated(apiWrapper, WorkingGroups.StorageWorkingGroup)
  })

  closeApi(apiWrapper)
})
