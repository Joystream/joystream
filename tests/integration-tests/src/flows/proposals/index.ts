import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { Utils } from '../../utils'
import {
  ApplyOnOpeningsHappyCaseFixture,
  CreateOpeningsFixture,
  DEFAULT_OPENING_PARAMS,
} from '../../fixtures/workingGroups'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { AllProposalsOutcomesFixture, TestedProposal } from '../../fixtures/proposals/AllProposalsOutcomesFixture'

//   // TODO:
//   // RuntimeUpgradeProposal
//   // TODO: Blog-related proposals:
//   // CreateBlogPost
//   // EditBlogPostProposal
//   // LockBlogPostProposal
//   // UnlockBlogPostProposal

export default async function creatingProposals({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger('flow:creating-proposals')
  debug('Started')
  api.enableDebugTxLogs()

  debug('Creating test lead openings and applications...')
  const createLeadOpeningsFixture = new CreateOpeningsFixture(
    api,
    query,
    'storageWorkingGroup',
    [DEFAULT_OPENING_PARAMS, DEFAULT_OPENING_PARAMS],
    true
  )
  await new FixtureRunner(createLeadOpeningsFixture).run()
  const [openingToCancelId, openingToFillId] = createLeadOpeningsFixture.getCreatedOpeningIds()

  const [applicantControllerAcc, applicantStakingAcc] = (await api.createKeyPairs(2)).map((kp) => kp.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [applicantControllerAcc])
  await new FixtureRunner(buyMembershipFixture).run()
  const [applicantMemberId] = buyMembershipFixture.getCreatedMembers()

  const addStakingAccountsFixture = new AddStakingAccountsHappyCaseFixture(api, query, [
    { asMember: applicantMemberId, account: applicantStakingAcc, stakeAmount: DEFAULT_OPENING_PARAMS.stake },
  ])
  await new FixtureRunner(addStakingAccountsFixture).run()

  const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, 'storageWorkingGroup', [
    {
      openingId: openingToFillId,
      applicants: [
        {
          memberId: applicantMemberId,
          stakingAccount: applicantStakingAcc,
          roleAccount: applicantControllerAcc,
          rewardAccount: applicantControllerAcc,
        },
      ],
      openingMetadata: DEFAULT_OPENING_PARAMS.metadata,
    },
  ])

  await new FixtureRunner(applyOnOpeningFixture).run()
  const [applicationId] = applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingToFillId)
  debug('Openings and applicantions created')

  const accountsToFund = (await api.createKeyPairs(5)).map((key) => key.address)
  const proposalsToTest: TestedProposal[] = [
    { details: { AmendConstitution: 'New constitution' } },
    { details: { FundingRequest: accountsToFund.map((a, i) => ({ account: a, amount: (i + 1) * 1000 })) } },
    { details: { Signal: 'Text' } },
    { details: { SetCouncilBudgetIncrement: 1_000_000 } },
    { details: { SetCouncilorReward: 100 } },
    { details: { SetInitialInvitationBalance: 10 } },
    { details: { SetInitialInvitationCount: 5 } },
    { details: { SetMaxValidatorCount: 100 } },
    { details: { SetMembershipLeadInvitationQuota: 50 } },
    { details: { SetMembershipPrice: 500 } },
    { details: { SetReferralCut: 25 } },
    { details: { UpdateWorkingGroupBudget: [10_000_000, 'Content', 'Negative'] }, expectExecutionFailure: true },
    {
      details: {
        CreateWorkingGroupLeadOpening: {
          description: Utils.metadataToBytes(OpeningMetadata, DEFAULT_OPENING_PARAMS.metadata),
          reward_per_block: DEFAULT_OPENING_PARAMS.reward,
          stake_policy: {
            leaving_unstaking_period: DEFAULT_OPENING_PARAMS.unstakingPeriod,
            stake_amount: DEFAULT_OPENING_PARAMS.stake,
          },
          working_group: 'Storage',
        },
      },
    },
    { details: { CancelWorkingGroupLeadOpening: [openingToCancelId, 'Storage'] } },
    {
      details: {
        FillWorkingGroupLeadOpening: {
          opening_id: openingToFillId,
          successful_application_id: applicationId,
          working_group: 'Storage',
        },
      },
    },
  ]

  const testAllOutcomesFixture = new AllProposalsOutcomesFixture(api, query, proposalsToTest)
  await new FixtureRunner(testAllOutcomesFixture).run()

  // The storage lead should be hired at this point, so we can test lead-related proposals

  const leadId = (await api.query.storageWorkingGroup.currentLead()).unwrap()
  const leadProposalsToTest: TestedProposal[] = [
    { details: { DecreaseWorkingGroupLeadStake: [leadId, 100, 'Storage'] } },
    { details: { SetWorkingGroupLeadReward: [leadId, 50, 'Storage'] } },
    { details: { SlashWorkingGroupLead: [leadId, 100, 'Storage'] } },
  ]
  const leadProposalsOutcomesFixture = new AllProposalsOutcomesFixture(api, query, leadProposalsToTest)
  await new FixtureRunner(leadProposalsOutcomesFixture).run()

  const terminateLeadProposalOutcomesFixture = new AllProposalsOutcomesFixture(api, query, [
    { details: { TerminateWorkingGroupLead: { worker_id: leadId, working_group: 'Storage', slashing_amount: 100 } } },
  ])
  await new FixtureRunner(terminateLeadProposalOutcomesFixture).run()

  debug('Done')
}
