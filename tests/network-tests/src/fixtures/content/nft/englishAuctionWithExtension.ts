import BN from 'bn.js'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { Utils } from '../../../utils'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { assertNftOwner, assertAuctionAndBids } from './utils'

export class NftEnglishAuctionWithExtensionFixture extends BaseQueryNodeFixture {
  private videoId: number
  private author: IMember
  private participants: IMember[]
  private auctionDuration: number
  private extensionPeriod: number

  constructor(
    api: Api,
    query: QueryNodeApi,
    videoId: number,
    author: IMember,
    participants: IMember[],
    auctionDuration: number,
    extensionPeriod: number
  ) {
    super(api, query)
    this.videoId = videoId
    this.author = author
    this.participants = participants
    this.auctionDuration = auctionDuration
    this.extensionPeriod = extensionPeriod
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug('Start NFT auction')
    const { auctionParams, startingPrice, minimalBidStep } = await this.api.createAuctionParameters('English')

    await this.api.startNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    const winner = this.participants[this.participants.length - 1]

    this.debug('Place bids')
    const placeBidsFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      this.participants,
      startingPrice,
      minimalBidStep,
      this.videoId
    )
    await new FixtureRunner(placeBidsFixture).run()

    this.debug('Wait for auction to end')

    const waitBlocks =
      this.auctionDuration + 1 + (this.participants.length >= this.extensionPeriod ? this.extensionPeriod : 0)
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Check NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, winner)

    this.debug('Complete auction')
    await this.api.claimWonEnglishAuction(winner.account, winner.memberId.toNumber(), this.videoId)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, winner)
  }
}
