import { initConfig } from '../../utils/config'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  AwaitPayoutFixture,
  BeginApplicationReviewFixture,
  ExpectMintCapacityChangedFixture,
  FillOpeningFixture,
  LeaveRoleFixture,
} from '../fixtures/workingGroupModule'
import BN from 'bn.js'
import tap from 'tap'
import { Utils } from '../../utils/utils'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../fixtures/proposalsModule'
import { PaidTermId } from '@alexandria/types/members'
import { OpeningId } from '@alexandria/types/hiring'
import { ProposalId } from '@alexandria/types/proposals'
import { DbService } from '../../services/dbService'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'
import { LeaderHiringHappyCaseFixture } from '../fixtures/leaderHiringHappyCase'

tap.mocha.describe('Worker application happy case scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const db: DbService = DbService.getInstance()

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.WORKING_GROUP_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const leaderFirstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const leaderRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const firstRewardInterval: BN = new BN(process.env.SHORT_FIRST_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.SHORT_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const mintCapacity: BN = new BN(process.env.STORAGE_WORKING_GROUP_MINTING_CAPACITY!)
  const durationInBlocks = 48
  const openingActivationDelay: BN = new BN(0)

  setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasCouncil()) {
    m1KeyPairs = db.getMembers()
    m2KeyPairs = db.getCouncil()
  } else {
    const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
      apiWrapper,
      sudo,
      m1KeyPairs,
      m2KeyPairs,
      paidTerms,
      K,
      greaterStake,
      lesserStake
    )
    councilElectionHappyCaseFixture.runner(false)
  }

  if (db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    m1KeyPairs = db.getMembers()
    leadKeyPair[0] = db.getLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))
  } else {
    const leaderHiringHappyCaseFixture: LeaderHiringHappyCaseFixture = new LeaderHiringHappyCaseFixture(
      apiWrapper,
      sudo,
      m1KeyPairs,
      leadKeyPair,
      paidTerms,
      applicationStake,
      roleStake,
      openingActivationDelay,
      leaderRewardInterval,
      leaderFirstRewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await leaderHiringHappyCaseFixture.runner(false)
  }

  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    mintCapacity,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose mint capacity', async () => workingGroupMintCapacityProposalFixture.runner(false))

  let voteForProposalFixture: VoteForProposalFixture
  const expectMintCapacityChanged: ExpectMintCapacityChangedFixture = new ExpectMintCapacityChangedFixture(
    apiWrapper,
    mintCapacity
  )
  tap.test('Approve mint capacity', async () => {
    voteForProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForProposalFixture.runner(false)
    await expectMintCapacityChanged.runner(false)
  })

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    apiWrapper,
    m1KeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Add worker opening', async () => addWorkerOpeningFixture.runner(false))

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('First apply for worker opening', async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      m1KeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningFixture.runner(false)
  })

  let beginApplicationReviewFixture: BeginApplicationReviewFixture
  tap.test('Begin application review', async () => {
    beginApplicationReviewFixture = new BeginApplicationReviewFixture(
      apiWrapper,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginApplicationReviewFixture.runner(false)
  })

  let fillOpeningFixture: FillOpeningFixture
  tap.test('Fill worker opening', async () => {
    fillOpeningFixture = new FillOpeningFixture(
      apiWrapper,
      m1KeyPairs,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillOpeningFixture.runner(false)
  })

  const awaitPayoutFixture: AwaitPayoutFixture = new AwaitPayoutFixture(
    apiWrapper,
    m1KeyPairs,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Await worker payout', async () => awaitPayoutFixture.runner(false))

  if (!db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      WorkingGroups.StorageWorkingGroup
    )
    tap.test('Leaving lead role', async () => leaveRoleFixture.runner(false))
  }

  closeApi(apiWrapper)
})
