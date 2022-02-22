import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner } from './utils'
import BN from 'bn.js'

export class AuctionCancelationsFixture extends BaseQueryNodeFixture {
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

    this.debug('Start NFT auction')
    const { auctionParams, startingPrice, minimalBidStep, bidLockDuration } = await this.api.createAuctionParameters(
      'Open'
    )
    await this.api.startNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    this.debug('Place bid')
    const placeBidsFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      [this.participant],
      startingPrice,
      minimalBidStep,
      this.videoId
    )
    await new FixtureRunner(placeBidsFixture).run()

    this.debug('Wait for bid to be cancelable')

    const waitBlocks = bidLockDuration.toNumber() + 1
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Cancel bid')
    await this.api.cancelOpenAuctionBid(this.participant.account, this.participant.memberId.toNumber(), this.videoId)

    this.debug('Cancel auction')
    await this.api.cancelNftAuction(this.author.account, this.author.memberId.toNumber(), this.videoId)

    this.debug(`Check NFT ownership haven't change`)
    await assertNftOwner(this.query, this.videoId, this.author)
  }
}
