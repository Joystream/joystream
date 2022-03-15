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

    this.debug('Start first NFT auction')
    const { auctionParams, startingPrice, minimalBidStep } = await this.api.createAuctionParameters('Open')
    await this.api.startNftAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    const firstAuctionWinner = this.participants[this.participants.length - 1]

    this.debug('Place bids on first auction')
    const firstAuctionMemberSetFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      this.participants,
      startingPrice,
      minimalBidStep,
      this.videoId
    )
    await new FixtureRunner(firstAuctionMemberSetFixture).run()

    this.debug('Check first NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, firstAuctionWinner)

    this.debug('Complete first auction')
    await this.api.pickOpenAuctionWinner(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug('Check NFT ownership change after first auction')
    await assertNftOwner(this.query, this.videoId, firstAuctionWinner)

    this.debug('Start second NFT auction')
    await this.api.startNftAuction(
      firstAuctionWinner.keyringPair.address,
      firstAuctionWinner.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    // prepare second auction participants, does not include first auction winner
    this.participants.pop()

    const secondAuctionWinner = this.participants[this.participants.length - 1]

    this.debug('Place bids on second auction')
    const secondAuctionMemberSetFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      this.participants,
      startingPrice,
      minimalBidStep,
      this.videoId
    )
    await new FixtureRunner(secondAuctionMemberSetFixture).run()

    this.debug('Check second NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, secondAuctionWinner)

    this.debug('Complete second auction')
    await this.api.pickOpenAuctionWinner(
      firstAuctionWinner.keyringPair.address,
      firstAuctionWinner.memberId.toNumber(),
      this.videoId
    )

    this.debug('Check NFT ownership change after second auction')
    await assertNftOwner(this.query, this.videoId, secondAuctionWinner)
  }
}
