import BN from 'bn.js'
import { Api } from '../../Api'
import { SpendingProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'

export default async function spendingProposal(api: Api, env: NodeJS.ProcessEnv) {
  const spendingBalance: BN = new BN(+env.SPENDING_BALANCE!)
  const mintCapacity: BN = new BN(+env.COUNCIL_MINTING_CAPACITY!)

  // Pre-conditions, members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const spendingProposalFixture = new SpendingProposalFixture(api, proposer, spendingBalance, mintCapacity)

  // Spending proposal test
  await spendingProposalFixture.runner()
}
