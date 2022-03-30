import { assert } from 'chai'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { BuyMembershipHappyCaseFixture } from '../../membership'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner, assertAuctionAndBids, assertNftEventContentActor } from './utils'
import BN from 'bn.js'

// settings
const sufficientTopupAmount = new BN(1000000) // some very big number to cover fees of all transactions

export class NftEnglishAuctionFixture extends BaseQueryNodeFixture {
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

    // creator royalty
    const creatorRoyalty = 5

    const nftIssuedResult = await this.api.issueNft(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      undefined,
      creatorRoyalty
    )
    const nftIssuedRuntimeEvent = await this.api.getEventDetails(nftIssuedResult, 'content', 'NftIssued')

    this.debug('Check Nft ownership in NftIssued event')
    await assertNftEventContentActor(
      this.query,
      () => this.query.getNftIssuedEvents([nftIssuedRuntimeEvent]),
      this.author.memberId.toString(),
      'Member'
    )

    this.debug('Start NFT auction')
    const {
      auctionParams,
      startingPrice,
      minimalBidStep,
      auctionDuration,
      extensionPeriod,
    } = await this.api.createEnglishAuctionParameters()
    const auctionStartedResult = await this.api.startEnglishAuction(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )
    const auctionStartedRuntimeEvent = await this.api.getEventDetails(
      auctionStartedResult,
      'content',
      'EnglishAuctionStarted'
    )

    this.debug('Check Nft ownership in EnglishAuctionStarted event')
    assertNftEventContentActor(
      this.query,
      () => this.query.getEnglishAuctionStartedEvents([auctionStartedRuntimeEvent]),
      this.author.memberId.toString(),
      'Member'
    )

    const winner = this.participants[this.participants.length - 1]

    this.debug('Place bids')
    const placeBidsFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      this.participants,
      startingPrice,
      minimalBidStep,
      this.videoId,
      'English'
    )
    await new FixtureRunner(placeBidsFixture).run()

    // remember block in which last bid was made
    const lastBidBlockNumber = await this.api.getBestBlock()

    // calculate auction ending block (accounting for auction extension caused by bids)
    const initialEndBlockNumber = startBlockNumber.add(auctionDuration)
    const realEndBlockNumber =
      lastBidBlockNumber < initialEndBlockNumber.sub(extensionPeriod)
        ? initialEndBlockNumber.add(extensionPeriod)
        : initialEndBlockNumber

    this.debug('Wait for auction to end')
    const waitBlocks = realEndBlockNumber.sub(lastBidBlockNumber).toNumber() + 1
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Check NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, winner)

    this.debug('Complete auction')
    const englishAuctionCompletedResult = await this.api.claimWonEnglishAuction(
      winner.account,
      winner.memberId.toNumber(),
      this.videoId
    )
    const englishAuctionCompletedRuntimeEvent = await this.api.getEventDetails(
      englishAuctionCompletedResult,
      'content',
      'EnglishAuctionCompleted'
    )

    this.debug('Check Nft ownership in EnglishAuctionCompleted event')
    await assertNftEventContentActor(
      this.query,
      () => this.query.getEnglishAuctionCompletedEvents([englishAuctionCompletedRuntimeEvent]),
      this.author.memberId.toString(),
      'Member'
    )

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, winner, (ownedNft) => {
      Utils.assert(ownedNft.creatorRoyalty, 'Royalty not found')
      assert.equal(ownedNft.creatorRoyalty, creatorRoyalty)
    })
  }
}
