import { assert } from 'chai'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembersAndCurators'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner, assertAuctionAndBids, assertNftEventContentActor } from './utils'

export class NftEnglishAuctionFixture extends BaseQueryNodeFixture {
  private videoId: number
  private author: IMember
  private participants: IMember[]

  constructor(api: Api, query: QueryNodeApi, videoId: number, author: IMember, participants: IMember[]) {
    super(api, query)
    this.videoId = videoId
    this.author = author
    this.participants = participants
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')

    // participants[0] places multiple bids
    const auctionParticipants = [this.participants[0], ...this.participants]
    const winner = auctionParticipants[auctionParticipants.length - 1]

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

    this.debug(`Start NFT auction (expected winner id ${winner.memberId})`)
    const duration = await this.api.query.content.minAuctionDuration()
    const { auctionParams, startingPrice, minimalBidStep, extensionPeriod } =
      await this.api.createEnglishAuctionParameters([], { extensionPeriod: duration, duration })

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
    await assertNftEventContentActor(
      this.query,
      () => this.query.getEnglishAuctionStartedEvents([auctionStartedRuntimeEvent]),
      this.author.memberId.toString(),
      'Member'
    )

    this.debug('Place bids')
    const placeBidsFixture = new PlaceBidsInAuctionFixture(
      this.api,
      this.query,
      auctionParticipants,
      startingPrice,
      minimalBidStep,
      this.videoId,
      'English'
    )
    await new FixtureRunner(placeBidsFixture).run()

    // calculate auction ending block (accounting for auction extension caused by bids)
    const runtimeEndBlockNumber = (await this.api.query.content.videoById(this.videoId)).nftStatus.unwrap()
      .transactionalStatus.asEnglishAuction.end
    const auctionStart = auctionStartedRuntimeEvent.blockNumber
    assert.equal(runtimeEndBlockNumber.toNumber(), auctionStart + duration.toNumber() + extensionPeriod.toNumber())

    this.debug('Wait for auction to end')
    await this.api.untilBlock(runtimeEndBlockNumber.toNumber())

    this.debug('Check NFT Auction and bids')
    await assertAuctionAndBids(this.query, this.videoId, winner, runtimeEndBlockNumber.toNumber())

    this.debug('Complete auction')
    const settleEnglishAuctionResult = await this.api.settleEnglishAuction(
      winner.account,
      winner.memberId.toNumber(),
      this.videoId
    )
    const englishAuctionSettledRuntimeEvent = await this.api.getEventDetails(
      settleEnglishAuctionResult,
      'content',
      'EnglishAuctionSettled'
    )

    this.debug('Check Nft ownership in SettleEnglishAuction event')
    await assertNftEventContentActor(
      this.query,
      () => this.query.getEnglishAuctionSettledEvents([englishAuctionSettledRuntimeEvent]),
      this.author.memberId.toString(),
      'Member'
    )

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, winner, (ownedNft) => {
      Utils.assert(ownedNft.creatorRoyalty, 'Royalty not found')
      Utils.assert(ownedNft.lastSalePrice, 'Last sale price not found')
      Utils.assert(ownedNft.lastSaleDate, 'Last sale date not found')
      assert.equal(ownedNft.creatorRoyalty, creatorRoyalty)
    })
  }
}
