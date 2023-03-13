import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { PalletProposalsCodexProposalDetails as ProposalDetails } from '@polkadot/types/lookup'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { CreateInterface, createType } from '@joystream/types'
import { CreateProposalsFixture } from './CreateProposalsFixture'
import { makeMembers } from '../membership/utils'
import { DecideOnProposalStatusFixture } from './DecideOnProposalStatusFixture'

export class PassProposalsFixture extends BaseQueryNodeFixture {
  protected details: CreateInterface<ProposalDetails>[] = []

  public constructor(api: Api, query: QueryNodeApi, details: CreateInterface<ProposalDetails>[]) {
    super(api, query)
    this.details = details
  }

  public async execute(): Promise<void> {
    const [proposer] = await makeMembers(this.api, this.query, 1)
    const createProposalsFixture = new CreateProposalsFixture(
      this.api,
      this.query,
      this.details.map((details, i) => {
        const proposalDetails = createType('PalletProposalsCodexProposalDetails', details)
        return {
          asMember: proposer.memberId,
          title: `Proposal to pass ${i}`,
          description: `Proposal to pass ${i}`,
          details: proposalDetails[`as${proposalDetails.type}`],
          type: proposalDetails.type,
        }
      })
    )
    await new FixtureRunner(createProposalsFixture).run()
    const proposalIds = createProposalsFixture.getCreatedProposalsIds()

    const decideOnProposalsStatusFixture = new DecideOnProposalStatusFixture(
      this.api,
      this.query,
      proposalIds.map((proposalId) => ({
        proposalId,
        status: 'Approved',
      }))
    )
    await new FixtureRunner(decideOnProposalsStatusFixture).run()
  }
}
