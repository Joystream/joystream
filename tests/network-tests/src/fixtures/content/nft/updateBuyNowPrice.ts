import { Api } from '../../../Api'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { IMember } from '../createMembersAndCurators'
import BN from 'bn.js'
import { assert } from 'chai'
import { Utils } from '../../../utils'

export class NftUpdateBuyNowPriceFixture extends BaseQueryNodeFixture {
  private videoId: number
  private author: IMember

  constructor(api: Api, query: QueryNodeApi, videoId: number, author: IMember) {
    super(api, query)
    this.videoId = videoId
    this.author = author
  }

  /*
      Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug('Start buy now auction')
    const originalBuyNowPrice = new BN(100) // value doesn't matter
    await this.api.sellNft(
      this.author.keyringPair.address,
      this.videoId,
      this.author.memberId.toNumber(),
      originalBuyNowPrice
    )

    this.debug('Update NFT buy now price')
    const newBuyNowPrice = originalBuyNowPrice.muln(2) // some higher value
    await this.api.updateBuyNowPrice(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      newBuyNowPrice
    )

    this.debug('Check NFT buy now price change')
    this.assertBuyNowPrice(this.query, this.videoId, newBuyNowPrice)
  }

  private async assertBuyNowPrice(query: QueryNodeApi, videoId: number, newPrice: BN) {
    await query.tryQueryWithTimeout(
      () => query.ownedNftByVideoId(videoId.toString()),
      (ownedNft) => {
        Utils.assert(ownedNft, 'NFT not found')
        Utils.assert(ownedNft.transactionalStatus)
        Utils.assert(
          ownedNft.transactionalStatus.__typename === 'TransactionalStatusBuyNow',
          'NFT not in Auction state'
        )
        assert.equal(ownedNft.transactionalStatus.price.toString(), newPrice.toString())
      }
    )
  }
}
