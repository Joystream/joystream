import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, InviteMembersHappyCaseFixture } from '../../fixtures/membership'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function invitingMembers({ api, query, env }: FlowProps): Promise<void> {
  const debug = Debugger('flow:inviting-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERS_INVITE_N!
  assert(N > 0)

  const [inviterAcc] = (await api.createKeyPairs(1)).map((key) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [inviterAcc])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [inviterMemberId] = buyMembershipHappyCaseFixture.getCreatedMembers()

  const inviteesAccs = (await api.createKeyPairs(N)).map((key) => key.address)
  const inviteMembersHappyCaseFixture = new InviteMembersHappyCaseFixture(
    api,
    query,
    { account: inviterAcc, memberId: inviterMemberId },
    inviteesAccs
  )
  await new FixtureRunner(inviteMembersHappyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
