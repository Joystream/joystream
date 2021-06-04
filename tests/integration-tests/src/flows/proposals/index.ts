import { FlowProps } from '../../Flow'
import { CreateProposalsFixture } from '../../fixtures/proposals'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { ProposalDetailsJsonByType, ProposalType } from '../../types'
import { Utils } from '../../utils'
import { DEFAULT_OPENING_PARAMS } from '../../fixtures/workingGroups'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import _ from 'lodash'
import { InitializeCouncilFixture } from '../../fixtures/council'

// const testProposalDetails = {
//   // TODO:
//   // RuntimeUpgrade: [],
//   // CreateBlogPost: [],
//   // // Requires a proposal:
//   // VetoProposal: [],
//   // // Requires an opening:
//   // CancelWorkingGroupLeadOpening: [],
//   // FillWorkingGroupLeadOpening: [],
//   // // Requires a lead:
//   // DecreaseWorkingGroupLeadStake: [],
//   // SetWorkingGroupLeadReward: [],
//   // SlashWorkingGroupLead: [],
//   // TerminateWorkingGroupLead: [],
//   // // Requires a blog post
//   // EditBlogPost: [],
//   // LockBlogPost: [],
//   // UnlockBlogPost: [],
// }

export default async function creatingProposals({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger('flow:creating-proposals')
  debug('Started')
  api.enableDebugTxLogs()

  debug('Initializing council...')
  const initializeCouncilFixture = new InitializeCouncilFixture(api, query)
  await new FixtureRunner(initializeCouncilFixture).run()
  debug('Council initialized')

  const accountsToFund = (await api.createKeyPairs(5)).map((key) => key.address)
  const proposalsDetails: { [K in ProposalType]?: ProposalDetailsJsonByType<K> } = {
    AmendConstitution: 'New constitution',
    FundingRequest: accountsToFund.map((a, i) => ({ account: a, amount: (i + 1) * 1000 })),
    Signal: 'Text',
    CreateWorkingGroupLeadOpening: {
      description: Utils.metadataToBytes(OpeningMetadata, DEFAULT_OPENING_PARAMS.metadata),
      reward_per_block: 100,
      stake_policy: {
        leaving_unstaking_period: 10,
        stake_amount: 10,
      },
      working_group: 'Content',
    },
    SetCouncilBudgetIncrement: 1_000_000,
    SetCouncilorReward: 100,
    SetInitialInvitationBalance: 10,
    SetInitialInvitationCount: 5,
    SetMaxValidatorCount: 100,
    SetMembershipLeadInvitationQuota: 50,
    SetMembershipPrice: 500,
    SetReferralCut: 25,
    UpdateWorkingGroupBudget: [1_000_000, 'Content', 'Negative'],
  }

  const proposalsN = Object.keys(proposalsDetails).length

  const memberKeys = (await api.createKeyPairs(proposalsN)).map((key) => key.address)
  const membersFixture = new BuyMembershipHappyCaseFixture(api, query, memberKeys)
  await new FixtureRunner(membersFixture).run()
  const memberIds = membersFixture.getCreatedMembers()

  const { maxActiveProposalLimit } = api.consts.proposalsEngine
  const proposalsPerBatch = maxActiveProposalLimit.toNumber()
  let i = 0
  let batch: [ProposalType, ProposalDetailsJsonByType][]
  while (
    (batch = (Object.entries(proposalsDetails) as [ProposalType, ProposalDetailsJsonByType][]).slice(
      i * proposalsPerBatch,
      (i + 1) * proposalsPerBatch
    )).length
  ) {
    await api.untilProposalsCanBeCreated(proposalsPerBatch)
    await Promise.all(
      batch.map(async ([proposalType, proposalDetails], j) => {
        debug(`Creating ${proposalType} proposal...`)
        const createProposalFixture = new CreateProposalsFixture(api, query, [
          {
            asMember: memberIds[i * proposalsPerBatch + j],
            title: `${_.startCase(proposalType)}`,
            description: `Test ${proposalType} proposal`,
            type: proposalType as ProposalType,
            details: proposalDetails,
          },
        ])
        await new FixtureRunner(createProposalFixture).runWithQueryNodeChecks()
      })
    )
    ++i
  }

  debug('Done')
}
