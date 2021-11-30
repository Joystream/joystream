import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { UpdateRuntimeFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource } from '../../Resources'

export default async function updateRuntime({ api, env, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:updateRuntime')
  debug('Started')
  await lock(Resource.Proposals)

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
    api.createKeyPairs(1).map(({ key }) => key.address),
    paidTerms
  )
  await new FixtureRunner(createMembershipsFixture).run()

  debug('Done')
}
