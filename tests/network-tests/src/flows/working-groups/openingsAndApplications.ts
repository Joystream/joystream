import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningsHappyCaseFixture,
  CancelOpeningsFixture,
  CreateOpeningsFixture,
  WithdrawApplicationsFixture,
  ApplicantDetails,
  createDefaultOpeningParams,
  OpeningParams,
} from '../../fixtures/workingGroups'
import { Api } from '../../Api'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { workingGroups } from '../../consts'
import { assert } from 'chai'

const openingsToCreate = (api: Api): OpeningParams[] => [
  // All defaults case:
  createDefaultOpeningParams(api),
  // Invalid metadata case:
  {
    ...createDefaultOpeningParams(api),
    metadata: '0xff',
    expectMetadataFailure: true,
  },
  // Valid metadata edge-cases:
  {
    ...createDefaultOpeningParams(api),
    metadata: {
      shortDescription: '',
      description: '',
      expectedEndingTimestamp: 0,
      hiringLimit: 0,
      applicationDetails: '',
      applicationFormQuestions: [],
    },
  },
  {
    ...createDefaultOpeningParams(api),
    metadata: {
      shortDescription: null,
      description: null,
      expectedEndingTimestamp: null,
      hiringLimit: null,
      applicationDetails: null,
      applicationFormQuestions: null,
    },
  },
  {
    ...createDefaultOpeningParams(api),
    metadata: {},
  },
  {
    ...createDefaultOpeningParams(api),
    metadata: {
      hiringLimit: 1,
      applicationFormQuestions: [{}],
    },
  },
]

export default async function openingsAndApplications({ api, query, env }: FlowProps): Promise<void> {
  const APPLICATION_CREATE_N = parseInt(env.APPLICATION_STATUS_CREATE_N || '')
  const APPLICATION_WITHDRAW_N = parseInt(env.APPLICATION_STATUS_WITHDRAW_N || '')
  assert.isAbove(APPLICATION_CREATE_N, 0)
  assert.isAbove(APPLICATION_WITHDRAW_N, 0)
  assert.isBelow(APPLICATION_WITHDRAW_N, APPLICATION_CREATE_N)

  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:openings-and-applications:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      // Transfer funds to leader staking acc to cover opening stake
      const leaderStakingAcc = await api.getLeaderStakingKey(group)
      await api.treasuryTransferBalance(
        leaderStakingAcc,
        api.consts.contentWorkingGroup.leaderOpeningStake.muln(openingsToCreate(api).length)
      )

      // Create an opening
      const createOpeningsFixture = new CreateOpeningsFixture(api, query, group, openingsToCreate(api))
      const openingsRunner = new FixtureRunner(createOpeningsFixture)
      await openingsRunner.run()
      const [openingId] = createOpeningsFixture.getCreatedOpeningIds()
      const { stake: openingStake, metadata: openingMetadata } = createDefaultOpeningParams(api)

      // Create some applications
      const roleAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map(({ key }) => key.address)
      const stakingAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map(({ key }) => key.address)
      const rewardAccounts = (await api.createKeyPairs(APPLICATION_CREATE_N)).map(({ key }) => key.address)

      const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, roleAccounts)
      await new FixtureRunner(buyMembershipFixture).run()
      const memberIds = buyMembershipFixture.getCreatedMembers()

      const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(
        api,
        query,
        memberIds.map((memberId, i) => ({
          asMember: memberId,
          account: stakingAccounts[i],
          stakeAmount: openingStake,
        }))
      )
      await new FixtureRunner(addStakingAccFixture).run()

      const applicants: ApplicantDetails[] = memberIds.map((memberId, i) => ({
        memberId,
        roleAccount: roleAccounts[i],
        stakingAccount: stakingAccounts[i],
        rewardAccount: rewardAccounts[i],
      }))
      const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, group, [
        {
          openingId,
          openingMetadata,
          applicants,
        },
      ])
      const applyRunner = new FixtureRunner(applyOnOpeningFixture)
      await applyRunner.run()
      const applicationIds = applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingId)

      // Withdraw some applications
      const withdrawApplicationsFixture = new WithdrawApplicationsFixture(
        api,
        query,
        group,
        roleAccounts.slice(0, APPLICATION_WITHDRAW_N),
        applicationIds.slice(0, APPLICATION_WITHDRAW_N)
      )
      const withdrawApplicationsRunner = new FixtureRunner(withdrawApplicationsFixture)
      await withdrawApplicationsRunner.run()

      // Cancel the opening
      const cancelOpeningFixture = new CancelOpeningsFixture(api, query, group, [openingId])
      const cancelOpeningRunner = new FixtureRunner(cancelOpeningFixture)
      await cancelOpeningRunner.run()

      // Run query node check
      await Promise.all([withdrawApplicationsRunner.runQueryNodeChecks(), cancelOpeningRunner.runQueryNodeChecks()])

      debug('Done')
    })
  )
}
