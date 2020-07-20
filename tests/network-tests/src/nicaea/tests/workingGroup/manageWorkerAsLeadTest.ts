import { initConfig } from '../../utils/config'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../impl/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import { membershipTest } from '../impl/membershipCreation'
import {
  addWorkerOpening,
  applyForOpening,
  beginApplicationReview,
  fillOpening,
  decreaseStake,
  slash,
  terminateRole,
  addLeaderOpening,
  beginLeaderApplicationReview,
  fillLeaderOpening,
  leaveRole,
} from './impl/workingGroupModule'
import BN from 'bn.js'
import tap = require('tap')

tap.mocha.describe('Manage worker as worker scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const nKeyPairs: KeyringPair[] = []
  const leadKeyPair: KeyringPair[] = []

  const keyring = new Keyring({ type: 'sr25519' })
  const N: number = +process.env.WORKING_GROUP_N!
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const durationInBlocks = 60
  const openingActivationDelay: BN = new BN(0)

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  setTestTimeout(apiWrapper, durationInBlocks)
  membershipTest(apiWrapper, nKeyPairs, keyring, N, paidTerms, sudoUri)
  membershipTest(apiWrapper, leadKeyPair, keyring, 1, paidTerms, sudoUri)

  let leadOpenignId: BN
  tap.test(
    'Add lead opening',
    async () =>
      (leadOpenignId = await addLeaderOpening(
        apiWrapper,
        nKeyPairs,
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test(
    'Apply for lead opening',
    async () =>
      await applyForOpening(
        apiWrapper,
        leadKeyPair,
        sudo,
        applicationStake,
        roleStake,
        leadOpenignId,
        WorkingGroups.StorageWorkingGroup,
        false
      )
  )
  tap.test('Begin lead application review', async () =>
    beginLeaderApplicationReview(apiWrapper, sudo, leadOpenignId, WorkingGroups.StorageWorkingGroup)
  )
  tap.test('Fill lead opening', async () =>
    fillLeaderOpening(
      apiWrapper,
      leadKeyPair,
      sudo,
      leadOpenignId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
  )

  let openignId: BN
  tap.test(
    'Add worker opening',
    async () =>
      (openignId = await addWorkerOpening(
        apiWrapper,
        nKeyPairs,
        leadKeyPair[0],
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay,
        unstakingPeriod,
        WorkingGroups.StorageWorkingGroup,
        false
      ))
  )
  tap.test(
    'Apply for worker opening',
    async () =>
      await applyForOpening(
        apiWrapper,
        nKeyPairs,
        sudo,
        applicationStake,
        roleStake,
        openignId,
        WorkingGroups.StorageWorkingGroup,
        false
      )
  )
  tap.test('Begin application review', async () =>
    beginApplicationReview(apiWrapper, leadKeyPair[0], sudo, openignId, WorkingGroups.StorageWorkingGroup)
  )
  tap.test('Fill worker opening', async () =>
    fillOpening(
      apiWrapper,
      nKeyPairs,
      leadKeyPair[0],
      sudo,
      openignId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
  )

  tap.test('Leaving lead role', async () => leaveRole(apiWrapper, leadKeyPair, sudo, WorkingGroups.StorageWorkingGroup))
  tap.test('Decrease worker stake, expect failure', async () =>
    decreaseStake(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, WorkingGroups.StorageWorkingGroup, true)
  )

  tap.test(
    'Add lead opening',
    async () =>
      (leadOpenignId = await addLeaderOpening(
        apiWrapper,
        nKeyPairs,
        sudo,
        applicationStake,
        roleStake,
        openingActivationDelay,
        WorkingGroups.StorageWorkingGroup
      ))
  )
  tap.test(
    'Apply for lead opening',
    async () =>
      await applyForOpening(
        apiWrapper,
        leadKeyPair,
        sudo,
        applicationStake,
        roleStake,
        leadOpenignId,
        WorkingGroups.StorageWorkingGroup,
        false
      )
  )
  tap.test('Begin lead application review', async () =>
    beginLeaderApplicationReview(apiWrapper, sudo, leadOpenignId, WorkingGroups.StorageWorkingGroup)
  )
  tap.test('Fill lead opening', async () =>
    fillLeaderOpening(
      apiWrapper,
      leadKeyPair,
      sudo,
      leadOpenignId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
  )

  tap.test('Decrease worker stake', async () =>
    decreaseStake(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, WorkingGroups.StorageWorkingGroup, false)
  )
  tap.test('Slash worker', async () =>
    slash(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, WorkingGroups.StorageWorkingGroup, false)
  )
  tap.test('Terminate worker role', async () =>
    terminateRole(apiWrapper, nKeyPairs, leadKeyPair[0], sudo, WorkingGroups.StorageWorkingGroup, false)
  )

  tap.test('Leaving lead role', async () => leaveRole(apiWrapper, leadKeyPair, sudo, WorkingGroups.StorageWorkingGroup))

  closeApi(apiWrapper)
})
