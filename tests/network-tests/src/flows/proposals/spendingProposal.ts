import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { SpendingProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource } from '../../Resources'

export default async function spendingProposal({ api, env, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:spendingProposals')
  debug('Started')
  await lock(Resource.Proposals)

  const spendingBalance: BN = new BN(+env.SPENDING_BALANCE!)
  const mintCapacity: BN = new BN(+env.COUNCIL_MINTING_CAPACITY!)

  // Pre-conditions, members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const spendingProposalFixture = new SpendingProposalFixture(api, proposer, spendingBalance, mintCapacity)

  // Spending proposal test
  await new FixtureRunner(spendingProposalFixture).run()

  debug('Done')
}
