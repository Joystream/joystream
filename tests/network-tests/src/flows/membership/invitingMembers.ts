import { FlowProps } from '../../Flow'
import { InviteMembersHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function invitingMembers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:inviting-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERS_INVITE_N!
  assert(N > 0)

  const [, leader] = await api.getLeader('membershipWorkingGroup')
  const leaderController = await api.getControllerAccountOfMember(leader.memberId)
  await api.makeSudoCall(api.tx.members.setLeaderInvitationQuota(N * 3))

  const inviteMembers = async () => {
    const inviteesAccs = (await api.createKeyPairs(N)).map(({ key }) => key.address)
    const inviteMembersHappyCaseFixture = new InviteMembersHappyCaseFixture(
      api,
      query,
      { account: leaderController, memberId: leader.memberId },
      inviteesAccs
    )
    await new FixtureRunner(inviteMembersHappyCaseFixture).runWithQueryNodeChecks()
  }

  await inviteMembers()

  // Update initialInvitationBalance and try again, do it twice just to be sure the correct value is always used
  for (let i = 0; i < 2; ++i) {
    await api.makeSudoCall(api.tx.members.setInitialInvitationBalance(10_000_000_000 * i))
    await inviteMembers()
  }

  debug('Done')
}
