import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import BN from 'bn.js'
import { assertNftOwner } from './utils'
import { assert } from 'chai'

export class NftUpdateVideoWithAuctionFixture extends BaseQueryNodeFixture {
  private author: IMember
  private videoId: number

  constructor(api: Api, query: QueryNodeApi, author: IMember, videoId: number) {
    super(api, query)
    this.author = author
    this.videoId = videoId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Update video with NFT being auctioned')
    const { auctionParams } = await this.api.createAuctionParameters('English')

    await this.api.updateVideoWithNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, this.author, (ownedNft) => {
      assert.equal(ownedNft.transactionalStatus.__typename, 'TransactionalStatusAuction')
    })
  }
}
