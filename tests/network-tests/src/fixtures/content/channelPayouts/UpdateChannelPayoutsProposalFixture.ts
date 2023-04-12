import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/primitives'
import { generateCommitmentFromPayloadFile } from '@joystream/js/content'
import BN from 'bn.js'
import fs from 'fs'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../../fixtures/proposals'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'

export type UpdateChannelPayoutsProposalParams = {
  asMember: MemberId
  protobufPayloadFilePath: string
  minCashoutAllowedInput?: BN
  maxCashoutAllowedInput?: BN
  channelCashoutsEnabled?: boolean
}

export class UpdateChannelPayoutsProposalFixture extends BaseQueryNodeFixture {
  private updateChannelPayoutsParams: UpdateChannelPayoutsProposalParams

  constructor(api: Api, query: QueryNodeApi, updateChannelPayoutsParams: UpdateChannelPayoutsProposalParams) {
    super(api, query)
    this.updateChannelPayoutsParams = updateChannelPayoutsParams
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Creating Channel Payouts Proposal')

    const { protobufPayloadFilePath, channelCashoutsEnabled, minCashoutAllowedInput, maxCashoutAllowedInput } =
      this.updateChannelPayoutsParams

    const expectedDataSizeFee = await this.api.getDataObjectPerMegabyteFee()
    const expectedDataObjectStateBloatBond = await this.api.getDataObjectStateBloatBond()
    const minCashoutAllowed = minCashoutAllowedInput || (await this.api.query.content.minCashoutAllowed())
    const maxCashoutAllowed = maxCashoutAllowedInput || (await this.api.query.content.maxCashoutAllowed())

    const createProposalsFixture = new CreateProposalsFixture(this.api, this.query, [
      {
        type: 'UpdateChannelPayouts',
        details: createType('PalletContentUpdateChannelPayoutsParametersRecord', {
          commitment: await generateCommitmentFromPayloadFile('PATH', protobufPayloadFilePath),
          payload: {
            objectCreationParams: {
              size_: fs.statSync(protobufPayloadFilePath).size,
              ipfsContentId: await Utils.calculateFileHash(protobufPayloadFilePath),
            },
            expectedDataSizeFee,
            expectedDataObjectStateBloatBond,
          },
          minCashoutAllowed,
          maxCashoutAllowed,
          channelCashoutsEnabled: channelCashoutsEnabled ?? true,
        }),
        asMember: this.updateChannelPayoutsParams.asMember,
        title: 'Channel Payouts Proposal',
        description: 'Proposal to update channel payouts',
      },
    ])

    await new FixtureRunner(createProposalsFixture).run()
    const [toBeApprovedByRuntimeProposalId] = createProposalsFixture.getCreatedProposalsIds()
    const decideOnProposalStatusFixture = new DecideOnProposalStatusFixture(this.api, this.query, [
      { proposalId: toBeApprovedByRuntimeProposalId, status: 'Approved' },
    ])
    await new FixtureRunner(decideOnProposalStatusFixture).runWithQueryNodeChecks()

    this.debug('Done')
  }
}
