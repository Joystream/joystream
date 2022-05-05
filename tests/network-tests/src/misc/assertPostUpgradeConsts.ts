import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import { CreateProposalsFixture } from '../fixtures/proposals/CreateProposalsFixture'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membership/BuyMembershipHappyCaseFixture'
import { FixtureRunner } from '../Fixture'

export default async function assertValues({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationAssertions')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  console.log(`Runtime Version: ${version.authoringVersion}.${version.specVersion}.${version.implVersion}`)
  assert.equal(version.specVersion.toNumber(), 6)

  debug('Check that post migration NFT value are updated')

  const maxNftStartingPrice = (await api.query.content.maxStartingPrice()).toNumber()
  const maxNftBidStep = (await api.query.content.maxBidStep()).toNumber()

  // These values are expected on production runtime profile
  assert.equal(maxNftStartingPrice, 1000000000000)
  assert.equal(maxNftBidStep, 1000000000000)

  debug('Check that post migration Forum values are updated')

  const maxForumCategories = api.consts.forum.maxCategories.toNumber()
  const maxForumSubCategories = api.consts.forum.maxSubcategories.toNumber()

  assert.equal(maxForumCategories, 40)
  assert.equal(maxForumSubCategories, 40)

  debug('Check set_council_budget_increment_proposal grace period')

  const [memberControllerAcc] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [memberControllerAcc])
  await new FixtureRunner(buyMembershipFixture).run()
  const [memberId] = buyMembershipFixture.getCreatedMembers()

  const createProposal = new CreateProposalsFixture(api, query, [
    {
      asMember: memberId,
      title: 'test proposal',
      description: 'testing council budget increment proposal grace period',
      exactExecutionBlock: undefined,
      type: 'SetCouncilBudgetIncrement',
      details: 1_000_000,
    },
  ])

  await new FixtureRunner(createProposal).run()
  const proposalId = createProposal.getCreatedProposalsIds()[0]
  const proposal = await api.query.proposalsEngine.proposals(proposalId)
  assert.equal(proposal.parameters.gracePeriod.toNumber(), 14400)

  debug('Done')
}
