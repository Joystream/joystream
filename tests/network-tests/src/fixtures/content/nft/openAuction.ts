import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { BuyMembershipHappyCaseFixture } from '../../membership'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { assertNftOwner, assertAuctionAndBids } from './utils'
import BN from 'bn.js'

// settings
const sufficientTopupAmount = new BN(1000000) // some very big number to cover fees of all transactions

export class NftOpenAuctionFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private videoId: number
  private author: IMember
  private participants: IMember[]

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    videoId: number,
    author: IMember,
    participants: IMember[]
  ) {
    super(api, query)
    this.cli = cli
    this.videoId = videoId
    this.author = author
    this.participants = participants
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    const firstAuctionWinner = this.participants[this.participants.length - 1]
    // prepare second auction participants, does not include first auction winner
    const secondAuctionParticipants = this.participants.slice(0, -1)
    const secondAuctionWinner = secondAuctionParticipants[secondAuctionParticipants.length - 1]

    this.debug(`Start first NFT auction (expected winner id ${firstAuctionWinner.memberId})`)
    const { auctionParams, startingPrice, minimalBidStep } = await this.api.createOpenAuctionParameters()
    await this.api.startOpenAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    this.debug('Place bids')
    const placeBidsFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      this.participants,
      startingPrice,
      minimalBidStep,
      this.videoId,
      'Open'
    )

    await new FixtureRunner(placeBidsFixture).run()

    this.debug('Check first NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, firstAuctionWinner)

    // equals to amount last bidder offered
    const targetPrice = placeBidsFixture.calcBidAmount(this.participants.length - 1)

    this.debug('Complete first auction')
    await this.api.pickOpenAuctionWinner(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      firstAuctionWinner.memberId.toNumber(),
      targetPrice
    )

    this.debug('Check NFT ownership change after first auction')
    await assertNftOwner(this.query, this.videoId, firstAuctionWinner)

    this.debug(`Start second NFT auction (expected winner id ${secondAuctionWinner.memberId})`)
    await this.api.startOpenAuction(
      firstAuctionWinner.keyringPair.address,
      firstAuctionWinner.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    this.debug('Place bids on second auction')
    const secondAuctionMemberSetFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      secondAuctionParticipants,
      startingPrice,
      minimalBidStep,
      this.videoId,
      'Open'
    )
    await new FixtureRunner(secondAuctionMemberSetFixture).run()

    this.debug('Check second NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, secondAuctionWinner)

    // equals to amount last bidder offered
    const targetPriceSecond = placeBidsFixture.calcBidAmount(secondAuctionParticipants.length - 1)

    this.debug('Complete second auction')
    await this.api.pickOpenAuctionWinner(
      firstAuctionWinner.keyringPair.address,
      firstAuctionWinner.memberId.toNumber(),
      this.videoId,
      secondAuctionWinner.memberId.toNumber(),
      targetPriceSecond
    )

    this.debug('Check NFT ownership change after second auction')
    await assertNftOwner(this.query, this.videoId, secondAuctionWinner)
  }
}
