import { FlowProps } from '../../Flow'
import {
  BuyMembershipHappyCaseFixture,
  VerifyValidatorInput,
  VerifyValidatorMembershipFixture,
} from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

export default async function updateValidatorVerificationStatus({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updating-validator-verification-status')
  debug('Started')
  api.enableDebugTxLogs()

  const workerId = await api.query.membershipWorkingGroup.currentLead()
  if (workerId.isNone) {
    throw new Error('Membership working group lead not set!')
  }

  const accounts = (await api.createKeyPairs(2)).map(({ key }) => key.address)
  const buyMembershipsFixture = new BuyMembershipHappyCaseFixture(api, query, accounts)
  await new FixtureRunner(buyMembershipsFixture).run()
  const memberIds = buyMembershipsFixture.getCreatedMembers()

  const updates1: VerifyValidatorInput[] = [
    { memberId: memberIds[0], isVerified: true },
    { memberId: memberIds[1], isVerified: true, asWorker: workerId.unwrap() },
  ]
  const verifyFixture = new VerifyValidatorMembershipFixture(api, query, updates1)
  await new FixtureRunner(verifyFixture).runWithQueryNodeChecks()

  const updates2: VerifyValidatorInput[] = [
    { memberId: memberIds[0], isVerified: false },
    { memberId: memberIds[1], isVerified: false, asWorker: workerId.unwrap() },
  ]
  const unverifyFixture = new VerifyValidatorMembershipFixture(api, query, updates2)
  await new FixtureRunner(unverifyFixture).runWithQueryNodeChecks()

  debug('Done')
}
