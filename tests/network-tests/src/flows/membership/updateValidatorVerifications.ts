import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { VerifyValidatorInput, VerifyValidatorMembershipFixture } from '../../fixtures/membership/VerifyValidatorMembershipFixture'

export default async function updateValidatorVerificationStatus({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updating-validator-verification-status')
  debug('Started')
  api.enableDebugTxLogs()

  const accounts = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(api, query, accounts)

  const updates1: VerifyValidatorInput[] = buyMembershipsFixture
    .getCreatedMembers()
    .map((memberId) => ({ memberId, isVerified: true }))

  const verifyFixture = new VerifyValidatorMembershipFixture(api, query, updates1)
  await new FixtureRunner(verifyFixture).runWithQueryNodeChecks()

  const updates2 = updates1.map(({ memberId }) => ({ memberId, isVerified : false }))

  const unverifyFixture = new VerifyValidatorMembershipFixture(api, query, updates2)
  await new FixtureRunner(unverifyFixture).runWithQueryNodeChecks()

  debug('Done')
}
