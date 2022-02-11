import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import BN from 'bn.js'
import { assertNftOwner } from './utils'
import { assert } from 'chai'

export class NftCreateVideoWithAuctionFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private author: IMember
  private channelId: number

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI, author: IMember, channelId: number) {
    super(api, query)
    this.cli = cli
    this.author = author
    this.channelId = channelId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Create video with NFT being auctioned')
    const startingPrice = new BN(10) // TODO - read min/max bounds from runtime (?)
    const minimalBidStep = new BN(10) // TODO - read min/max bounds from runtime (?)
    const auctionParams = this.api.createAuctionParameters('English', startingPrice, minimalBidStep)

    const response = await this.api.createVideoWithNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.channelId,
      auctionParams
    )

    const event = await this.api.retrieveVideoCreatedEventDetails(response)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, event.videoId.toNumber(), this.author, (ownedNft) => {
      assert.equal(ownedNft.transactionalStatus.__typename, 'TransactionalStatusAuction')
    })
  }
}
