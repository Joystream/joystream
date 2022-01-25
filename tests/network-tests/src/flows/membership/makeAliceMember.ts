import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

export default async function makeAliceMember({ api, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:makeAliceMember')
  debug('Started')

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // Assert membership can be bought if sufficient funds are available
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    ['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
    paidTerms
  )
  await new FixtureRunner(happyCaseFixture).run()

  debug('Done')
}
