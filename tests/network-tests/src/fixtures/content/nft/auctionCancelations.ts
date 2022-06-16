import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner, ensureMemberOpenAuctionBidsAreCancelled } from './utils'
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

    // SCENARIO 1: Cancel bid during auction
    {
      this.debug('Start NFT auction')
      const {
        auctionParams,
        startingPrice,
        minimalBidStep,
        bidLockDuration,
      } = await this.api.createOpenAuctionParameters()
      await this.api.startOpenAuction(
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
        this.videoId,
        'Open'
      )
      await new FixtureRunner(placeBidsFixture).run()

      this.debug('Wait for bid to be cancelable')

      const waitBlocks = bidLockDuration.toNumber() + 1
      await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

      this.debug('Cancel bid')
      await this.api.cancelOpenAuctionBid(this.participant.account, this.participant.memberId.toNumber(), this.videoId)

      // ensure bid has been canceled
      ensureMemberOpenAuctionBidsAreCancelled(this.query, this.videoId, this.participant)

      this.debug('Cancel auction')
      await this.api.cancelOpenAuction(this.author.account, this.author.memberId.toNumber(), this.videoId)

      this.debug(`Check NFT ownership haven't change`)
      await assertNftOwner(this.query, this.videoId, this.author)
    }

    // SCENARIO 2: Cancel bid by re-bidding auction
    {
      const {
        auctionParams,
        startingPrice,
        minimalBidStep,
        bidLockDuration,
      } = await this.api.createOpenAuctionParameters()

      this.debug('Start NFT auction')
      await this.api.startOpenAuction(
        this.author.keyringPair.address,
        this.author.memberId.toNumber(),
        this.videoId,
        auctionParams
      )

      this.debug('Place first bid in auction')
      const placeFirstBidFixture = new PlaceBidsInAuctionFixture(
        this.api,
        this.query,
        [this.participant],
        startingPrice.addn(1),
        minimalBidStep,
        this.videoId,
        'Open'
      )
      await new FixtureRunner(placeFirstBidFixture).run()

      this.debug('Wait for bid to be cancelable')

      const waitBlocksForFirstBid = bidLockDuration.toNumber() + 1
      await Utils.wait(this.api.getBlockDuration().muln(waitBlocksForFirstBid).toNumber())

      this.debug('Place second bid auction')
      // This should cancel the first bid by member
      const placeBidsInFirstAuctionFixture = new PlaceBidsInAuctionFixture(
        this.api,
        this.query,
        [this.participant],
        startingPrice,
        minimalBidStep,
        this.videoId,
        'Open'
      )
      await new FixtureRunner(placeBidsInFirstAuctionFixture).run()

      this.debug('Wait for bid to be cancelable')

      const waitBlocksForSecondBid = bidLockDuration.toNumber() + 1
      await Utils.wait(this.api.getBlockDuration().muln(waitBlocksForSecondBid).toNumber())

      this.debug('Cancel bid')
      await this.api.cancelOpenAuctionBid(this.participant.account, this.participant.memberId.toNumber(), this.videoId)

      // ensure bids has been canceled
      ensureMemberOpenAuctionBidsAreCancelled(this.query, this.videoId, this.participant)

      this.debug('Cancel auction')
      await this.api.cancelOpenAuction(this.author.account, this.author.memberId.toNumber(), this.videoId)

      this.debug(`Check NFT ownership haven't change`)
      await assertNftOwner(this.query, this.videoId, this.author)
    }

    // SCENARIO 3: Cancel bid after auction
    {
      this.debug('Start NFT auction')
      const {
        auctionParams,
        startingPrice,
        minimalBidStep,
        bidLockDuration,
      } = await this.api.createOpenAuctionParameters()
      await this.api.startOpenAuction(
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
        this.videoId,
        'Open'
      )
      await new FixtureRunner(placeBidsFixture).run()

      this.debug('Wait for bid to be cancelable')

      const waitBlocks = bidLockDuration.toNumber() + 1
      await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

      this.debug('Cancel auction')
      await this.api.cancelOpenAuction(this.author.account, this.author.memberId.toNumber(), this.videoId)

      this.debug('Cancel bid')
      await this.api.cancelOpenAuctionBid(this.participant.account, this.participant.memberId.toNumber(), this.videoId)

      // ensure bid has been canceled
      ensureMemberOpenAuctionBidsAreCancelled(this.query, this.videoId, this.participant)

      this.debug(`Check NFT ownership haven't change`)
      await assertNftOwner(this.query, this.videoId, this.author)
    }
  }
}
