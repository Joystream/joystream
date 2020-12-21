import BN from 'bn.js'
import { FlowArgs } from '../../Scenario'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { UpdateRuntimeFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'

export default async function updateRuntime({ api, env }: FlowArgs): Promise<void> {
  const debug = Debugger('flow:updateRuntime')
  debug('Started')

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const runtimePath: string = env.RUNTIME_WASM_PATH!

  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const updateRuntimeFixture: UpdateRuntimeFixture = new UpdateRuntimeFixture(api, proposer, runtimePath)
  await new FixtureRunner(updateRuntimeFixture).run()

  // Some tests after runtime update
  const createMembershipsFixture = new BuyMembershipHappyCaseFixture(
    api,
    api.createKeyPairs(1).map((key) => key.address),
    paidTerms
  )
  await new FixtureRunner(createMembershipsFixture).run()

  debug('Done')
}
