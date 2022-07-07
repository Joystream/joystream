import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { CreateProposalsFixture, ExpireProposalsFixture, ProposalCreationParams } from '../../fixtures/proposals'
import { Resource } from '../../Resources'
import { Bytes } from '@polkadot/types/'
import { createType } from '@joystream/types'

export default async function expireProposal({ api, query, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:expire-proposal')
  debug('Started')
  api.enableDebugTxLogs()

  const unlock = await lock(Resource.Proposals)

  const [account] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [account])
  await new FixtureRunner(buyMembershipFixture).run()
  const [memberId] = buyMembershipFixture.getCreatedMembers()

  const createProposalFixture = new CreateProposalsFixture(api, query, [
    {
      type: 'Signal',
      details: (`Proposal to be Expired` as unknown) as Bytes,
      asMember: memberId,
      title: `Proposal to be Expired`,
      description: `Proposal to be Expired`,
    } as ProposalCreationParams<'Signal'>,
  ])
  await new FixtureRunner(createProposalFixture).run()
  const [proposalId] = createProposalFixture.getCreatedProposalsIds()

  const expireProposalFixture = new ExpireProposalsFixture(api, query, [proposalId])
  await new FixtureRunner(expireProposalFixture).runWithQueryNodeChecks()

  unlock()

  debug('Done')
}
