import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, InviteMembersHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { Resource } from '../../Resources'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../fixtures/proposals'
import { createType } from '@joystream/types'
import { getWorkingGroupNameByModuleName } from '../../consts'

export default async function invitingMembers({ api, query, env, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:inviting-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERS_INVITE_N!
  assert(N > 0)

  const [inviterAcc] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [inviterAcc])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [inviterMemberId] = buyMembershipHappyCaseFixture.getCreatedMembers()

  // Membership WG balance required
  const initialInvitationBalance = (await api.query.members.initialInvitationBalance()).muln(N)

  // Top up working group budget to allow funding invited members
  const [roleAccount] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [roleAccount])
  await new FixtureRunner(buyMembershipFixture).run()
  const [memberId] = buyMembershipFixture.getCreatedMembers()

  const unlock = await lock(Resource.Proposals)
  const updateWgBudgetProposalFixture = new CreateProposalsFixture(api, query, [
    {
      type: 'UpdateWorkingGroupBudget',
      details: createType('(u128, PalletCommonWorkingGroupIterableEnumsWorkingGroup, PalletCommonBalanceKind)', [
        initialInvitationBalance,
        getWorkingGroupNameByModuleName('membershipWorkingGroup'),
        createType('PalletCommonBalanceKind', 'Positive'),
      ]),
      asMember: memberId,
      title: 'Proposal to set budget',
      description: `Proposal to set budget for membership working group`,
    },
  ])
  await new FixtureRunner(updateWgBudgetProposalFixture).run()
  const [updateWgBudgetProposalId] = updateWgBudgetProposalFixture.getCreatedProposalsIds()
  const decideOnUpdateWgBudgetProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
    { proposalId: updateWgBudgetProposalId, status: 'Approved', expectExecutionFailure: false },
  ])
  await new FixtureRunner(decideOnUpdateWgBudgetProposalStatusFixture).run()
  unlock()

  const inviteesAccs = (await api.createKeyPairs(N)).map(({ key }) => key.address)
  const inviteMembersHappyCaseFixture = new InviteMembersHappyCaseFixture(
    api,
    query,
    { account: inviterAcc, memberId: inviterMemberId },
    inviteesAccs
  )
  await new FixtureRunner(inviteMembersHappyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
