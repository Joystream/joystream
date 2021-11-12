import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { FlowProps } from '../../Flow'
import { AssignCouncilFixture } from '../../fixtures/councilAssignment'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { Resource } from '../../Resources'

export default async function assignCoundil({ api, env, lock }: FlowProps): Promise<void> {
  const label = 'assignCouncil'
  const debug = extendDebug(`flow:${label}`)

  debug('Started')

  await lock(Resource.Council)

  // Skip creating council if already elected
  if ((await api.getCouncil()).length) {
    return debug('Skipping council setup. A Council is already elected')
  }

  debug('Assigning new council')

  const councilSize = (await api.getCouncilSize()).toNumber()
  const council = []
  for (let i = 0; i < councilSize; i++) {
    council.push(api.createCustomKeyPair(`CouncilMember//${i}`).address)
  }

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  const createMembersFixture = new BuyMembershipHappyCaseFixture(api, council, paidTerms)
  await new FixtureRunner(createMembersFixture).run()

  const councilAssignment = new AssignCouncilFixture(api, council)
  await new FixtureRunner(councilAssignment).run()

  debug('Done')
}
