import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import BN from 'bn.js'
import { assertNftOwner } from './utils'
import { Utils } from '../../../utils'

export class NftBuyNowFixture extends BaseQueryNodeFixture {
  private videoId: number
  private author: IMember
  private participant: IMember

  constructor(api: Api, query: QueryNodeApi, videoId: number, author: IMember, participant: IMember) {
    super(api, query)
    this.videoId = videoId
    this.author = author
    this.participant = participant
  }

  /*
      Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug(`Start buy now auction (expected winner id ${this.participant.memberId})`)
    const buyNowPrice = new BN(100) // value doesn't matter
    await this.api.sellNft(this.author.keyringPair.address, this.videoId, this.author.memberId.toNumber(), buyNowPrice)

    this.debug('Buy now')
    await this.api.buyNft(this.participant.account, this.videoId, this.participant.memberId.toNumber(), buyNowPrice)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, this.participant, (ownedNft) => {
      Utils.assert(ownedNft.lastSalePrice, 'Last sale price not found')
      Utils.assert(ownedNft.lastSaleDate, 'Last sale date not found')
    })
  }
}
