import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  UpdateVerificationStatusDetails,
  UpdateVerificationStatusFixture,
} from '../../fixtures/membership/UpdateVerificationStatusFixture'

export default async function updatingVerificationStatus({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updating-member-verification-status')
  debug('Started')
  api.enableDebugTxLogs()

  const accounts = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(api, query, accounts)
  await new FixtureRunner(buyMembershipsFixture).runWithQueryNodeChecks()

  const updates1: UpdateVerificationStatusDetails[] = buyMembershipsFixture
    .getCreatedMembers()
    .map((memberId) => ({ memberId, isVerified: true }))
  const updateStatusFixture1 = new UpdateVerificationStatusFixture(api, query, updates1)
  await new FixtureRunner(updateStatusFixture1).runWithQueryNodeChecks()

  const updates2: UpdateVerificationStatusDetails[] = buyMembershipsFixture
    .getCreatedMembers()
    .map((memberId) => ({ memberId, isVerified: false }))
  const updateStatusFixture2 = new UpdateVerificationStatusFixture(api, query, updates2)
  await new FixtureRunner(updateStatusFixture2).runWithQueryNodeChecks()

  debug('Done')
}
