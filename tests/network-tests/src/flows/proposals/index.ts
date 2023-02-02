import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { Utils } from '../../utils'
import { ApplyOnOpeningsHappyCaseFixture, createDefaultOpeningParams } from '../../fixtures/workingGroups'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import {
  AllProposalsOutcomesFixture,
  CreateProposalsFixture,
  DecideOnProposalStatusFixture,
  TestedProposal,
} from '../../fixtures/proposals'
import { createType } from '@joystream/types'
import { Resource } from '../../Resources'
import { OpeningId } from '@joystream/types/primitives'

export default async function creatingProposals({ api, query, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:creating-proposals')
  debug('Started')
  api.enableVerboseTxLogs()

  debug('Creating test lead openings and applications...')

  const [applicantControllerAcc, applicantStakingAcc] = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [applicantControllerAcc])
  await new FixtureRunner(buyMembershipFixture).run()
  const [applicantMemberId] = buyMembershipFixture.getCreatedMembers()

  const unlock = await lock(Resource.Proposals)
  const openingParams = createDefaultOpeningParams(api)
  const createLeadOpeningProposalsFixture = new CreateProposalsFixture(api, query, [
    {
      type: 'CreateWorkingGroupLeadOpening',
      details: createType('PalletProposalsCodexCreateOpeningParameters', {
        'description': createType('Bytes', `Proposal to hire lead membership TO CANCEL `),
        'stakePolicy': createType('PalletWorkingGroupStakePolicy', {
          'stakeAmount': openingParams.stake,
          'leavingUnstakingPeriod': openingParams.unstakingPeriod,
        }),
        'rewardPerBlock': openingParams.reward,
        'group': createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Membership'),
      }),
      asMember: applicantMemberId,
      title: 'Proposal to Hired lead TO KEEP',
      description: 'Proposal to hire lead membership',
    },
    {
      type: 'CreateWorkingGroupLeadOpening',
      details: createType('PalletProposalsCodexCreateOpeningParameters', {
        'description': createType('Bytes', `Proposal to hire lead membership TO BE CANCELLED`),
        'stakePolicy': createType('PalletWorkingGroupStakePolicy', {
          'stakeAmount': openingParams.stake,
          'leavingUnstakingPeriod': openingParams.unstakingPeriod,
        }),
        'rewardPerBlock': openingParams.reward,
        'group': createType('PalletCommonWorkingGroupIterableEnumsWorkingGroup', 'Membership'),
      }),
      asMember: applicantMemberId,
      title: 'Proposal to Hired lead TO BE CANCELLED',
      description: 'Proposal to hire lead membership',
    },
  ])
  await new FixtureRunner(createLeadOpeningProposalsFixture).run()
  const [proposalWithOpeningToBeCancelled, proposalWithOpeningToBeKept] =
    createLeadOpeningProposalsFixture.getCreatedProposalsIds()

  const approveProposalsFixture = new DecideOnProposalStatusFixture(api, query, [
    { proposalId: proposalWithOpeningToBeCancelled, status: 'Approved', expectExecutionFailure: false },
    { proposalId: proposalWithOpeningToBeKept, status: 'Approved', expectExecutionFailure: false },
  ])
  await new FixtureRunner(approveProposalsFixture).run()
  const openingsCreated = (
    await approveProposalsFixture.getExecutionEvents('membershipWorkingGroup', 'OpeningAdded')
  ).map((dispatchEvents) => {
    if (dispatchEvents) {
      return dispatchEvents.map((e) => e.data[0]) // first element in the tuple: Openingid
    } else {
      return undefined
    }
  })[0]
  unlock()
  const [openingToCancelId, openingToFillId] = openingsCreated! as OpeningId[]

  // stake to apply
  const addStakingAccountsFixture = new AddStakingAccountsHappyCaseFixture(api, query, [
    { asMember: applicantMemberId, account: applicantStakingAcc, stakeAmount: createDefaultOpeningParams(api).stake },
  ])
  await new FixtureRunner(addStakingAccountsFixture).run()

  const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, 'membershipWorkingGroup', [
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
      openingMetadata: createDefaultOpeningParams(api).metadata,
    },
  ])

  await new FixtureRunner(applyOnOpeningFixture).run()
  const [applicationId] = applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingToFillId)
  debug('Openings and applicantions created')

  const accountsToFund = (await api.createKeyPairs(5)).map(({ key }) => key.address)
  const proposalsToTest: TestedProposal[] = [
    { details: createType('PalletProposalsCodexProposalDetails', { AmendConstitution: 'New constitution' }) },
    // {
    //   details: createType('PalletProposalsCodexProposalDetails', {
    //     FundingRequest: accountsToFund.map((a, i) => ({ account: a, amount: (i + 1) * 1000 })),
    //   }),
    //   expectExecutionFailure: true, // InsufficientFunds
    // },
    { details: createType('PalletProposalsCodexProposalDetails', { Signal: 'Text' }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetCouncilBudgetIncrement: 1_000_000 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetCouncilorReward: 100 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetInitialInvitationBalance: 10 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetInitialInvitationCount: 5 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetMaxValidatorCount: 100 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetMembershipPrice: 500 }) },
    { details: createType('PalletProposalsCodexProposalDetails', { SetReferralCut: 25 }) },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        UpdateWorkingGroupBudget: [10_000_000, 'Content', 'Negative'],
      }),
      expectExecutionFailure: true, // InsufficientFunds
    },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        CreateWorkingGroupLeadOpening: {
          description: Utils.metadataToBytes(OpeningMetadata, createDefaultOpeningParams(api).metadata),
          rewardPerBlock: createDefaultOpeningParams(api).reward,
          stakePolicy: {
            leavingUnstakingPeriod: createDefaultOpeningParams(api).unstakingPeriod,
            stakeAmount: createDefaultOpeningParams(api).stake,
          },
          group: 'Membership',
        },
      }),
    },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        CancelWorkingGroupLeadOpening: [openingToCancelId, 'Membership'],
      }),
    },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        FillWorkingGroupLeadOpening: {
          openingId: openingToFillId,
          applicationId,
          workingGroup: 'Membership',
        },
      }),
    },
  ]

  const testAllOutcomesFixture = new AllProposalsOutcomesFixture(api, query, lock, proposalsToTest)
  await new FixtureRunner(testAllOutcomesFixture).run()

  debug('FIRST LEG OF PROPOSALS DONE')
  // The membership lead should be hired at this point, so we can test lead-related proposals

  const leadId = (await api.query.membershipWorkingGroup.currentLead()).unwrap()
  const leadProposalsToTest: TestedProposal[] = [
    { details: createType('PalletProposalsCodexProposalDetails', { SetMembershipLeadInvitationQuota: 50 }) },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        DecreaseWorkingGroupLeadStake: [leadId, 100, 'Membership'],
      }),
    },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        SetWorkingGroupLeadReward: [leadId, 50, 'Membership'],
      }),
    },
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        SlashWorkingGroupLead: [leadId, 100, 'Membership'],
      }),
    },
  ]
  const leadProposalsOutcomesFixture = new AllProposalsOutcomesFixture(api, query, lock, leadProposalsToTest)
  await new FixtureRunner(leadProposalsOutcomesFixture).run()
  debug('SECOND LEG OF PROPOSALS DONE')

  const terminateLeadProposalOutcomesFixture = new AllProposalsOutcomesFixture(api, query, lock, [
    {
      details: createType('PalletProposalsCodexProposalDetails', {
        TerminateWorkingGroupLead: { workerId: leadId, group: 'Membership', slashingAmount: 100 },
      }),
    },
  ])
  await new FixtureRunner(terminateLeadProposalOutcomesFixture).run()

  debug('Done')
}
