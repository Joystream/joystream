import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import BN from 'bn.js'
import { assertNftOwner } from './utils'
import { assert } from 'chai'

export class NftCreateVideoWithAuctionFixture extends BaseQueryNodeFixture {
  private author: IMember
  private channelId: number

  constructor(api: Api, query: QueryNodeApi, author: IMember, channelId: number) {
    super(api, query)
    this.author = author
    this.channelId = channelId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Create video with NFT being auctioned')
    const { auctionParams } = await this.api.createAuctionParameters('English')

    const response = await this.api.createVideoWithNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.channelId,
      auctionParams
    )

    const event = await this.api.getEvent(response, 'content', 'VideoCreated')

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, event.data[2].toNumber(), this.author, (ownedNft) => {
      assert.equal(ownedNft.transactionalStatus.__typename, 'TransactionalStatusAuction')
    })
  }
}
