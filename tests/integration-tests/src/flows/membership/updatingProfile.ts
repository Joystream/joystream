import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, UpdateProfileHappyCaseFixture } from '../../fixtures/membershipModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'

export default async function updatingProfile({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger('flow:member-profile-update')
  debug('Started')
  api.enableDebugTxLogs()

  const [account] = (await api.createKeyPairs(1)).map((key) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [account])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers()
  const updateProfileHappyCaseFixture = new UpdateProfileHappyCaseFixture(api, query, {
    account,
    memberId,
  })
  await new FixtureRunner(updateProfileHappyCaseFixture).run()

  debug('Done')
}
