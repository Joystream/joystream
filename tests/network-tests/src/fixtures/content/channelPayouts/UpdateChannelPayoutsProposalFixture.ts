import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/primitives'
import { generateCommitmentFromPayloadFile } from '@joystreamjs/content'
import BN from 'bn.js'
import { assert } from 'chai'
import fs from 'fs'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../../fixtures/proposals'
import { Maybe } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'

export type UpdateChannelPayoutsProposalParams = {
  asMember: MemberId
  protobufPayloadFilePath: string
  uploaderAccount: string
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
    const minCashoutAllowed = minCashoutAllowedInput || (await this.api.query.content.minCashoutAllowed()).addn(1)
    const maxCashoutAllowed =
      maxCashoutAllowedInput || (await this.api.query.content.minCashoutAllowed()).addn(10000000)

    const createProposalsFixture = new CreateProposalsFixture(this.api, this.query, [
      {
        type: 'UpdateChannelPayouts',
        details: createType('PalletContentUpdateChannelPayoutsParametersRecord', {
          commitment: await generateCommitmentFromPayloadFile('PATH', protobufPayloadFilePath),
          payload: {
            uploaderAccount: this.updateChannelPayoutsParams.uploaderAccount,
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

  /**
    Asserts a channel, or a video/channel categories have their active videos counter set properly
    in Query node.
  */
  private async assertCounterMatch(
    entityName: 'channel' | 'videoCategory',
    entityId: number | string,
    expectedCount: number
  ) {
    const getterName = `${entityName}ById` as 'channelById' | 'videoCategoryById'
    await this.query.tryQueryWithTimeout(
      () => this.query[getterName](entityId.toString()) as Promise<Maybe<{ id: string; activeVideosCounter: number }>>,
      (entity) => {
        Utils.assert(entity)
        assert.equal(entity.activeVideosCounter, expectedCount)
      }
    )
  }
}
