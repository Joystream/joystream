import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, TransferInvitesHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

export default async function transferringInvites({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:transferring-invites')
  debug('Started')
  api.enableDebugTxLogs()

  const [fromAcc, toAcc] = (await api.createKeyPairs(2)).map((key) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [fromAcc, toAcc])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [fromMemberId, toMemberId] = buyMembershipHappyCaseFixture.getCreatedMembers()

  const transferInvitesHappyCaseFixture = new TransferInvitesHappyCaseFixture(
    api,
    query,
    { memberId: fromMemberId, account: fromAcc },
    { memberId: toMemberId, account: toAcc }
  )
  await new FixtureRunner(transferInvitesHappyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
