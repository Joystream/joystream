import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, InviteMembersHappyCaseFixture } from '../../fixtures/membership'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { PassProposalsFixture } from '../../fixtures/proposals'
import { Utils } from '../../utils'

export default async function invitingMembers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:inviting-members')
  debug('Started')
  api.enableDebugTxLogs()

  Utils.assert(env.MEMBERS_INVITE_N)
  const N: number = +env.MEMBERS_INVITE_N
  assert(N > 0)

  const inviterAccs = (await api.createKeyPairs(3)).map(({ key }) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, inviterAccs)
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const inviterMemberIds = buyMembershipHappyCaseFixture.getCreatedMembers()

  // Membership WG balance required
  const groupBudget = (await api.query.members.initialInvitationBalance()).muln(3 * N)

  // Top up working group budget to allow funding invited members
  await api.fundWorkingGroupBudget('membershipWorkingGroup', inviterMemberIds[0], groupBudget)

  for (let i = 0; i < 3; ++i) {
    const inviteesAccs = (await api.createKeyPairs(N)).map(({ key }) => key.address)
    const inviteMembersHappyCaseFixture = new InviteMembersHappyCaseFixture(
      api,
      query,
      { account: inviterAccs[i], memberId: inviterMemberIds[i] },
      inviteesAccs
    )
    await new FixtureRunner(inviteMembersHappyCaseFixture).runWithQueryNodeChecks()
    if (i !== 2) {
      // Update initialInvitationBalance before trying again.
      // This will be done twice just to be sure the correct initialInvitationBalance value is always used.
      const passProposalsFixture = new PassProposalsFixture(api, query, [
        {
          SetInitialInvitationBalance: Utils.joy(i + 1),
        },
      ])
      await new FixtureRunner(passProposalsFixture).run()
    }
  }

  debug('Done')
}
