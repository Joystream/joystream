import { assert } from 'chai'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { BuyMembershipHappyCaseFixture } from '../../membership'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner } from './utils'
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

    await this.api.issueNft(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      undefined,
      creatorRoyalty
    )

    this.debug('Start NFT auction')
    const {
      auctionParams,
      startingPrice,
      minimalBidStep,
      auctionDuration,
      extensionPeriod,
    } = await this.api.createAuctionParameters('English')
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
    const waitBlocks = Math.min(auctionDuration.toNumber(), extensionPeriod.toNumber() + this.participants.length) + 1
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Complete auction')
    await this.api.claimWonEnglishAuction(winner.account, winner.memberId.toNumber(), this.videoId)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, winner, (ownedNft) => {
      Utils.assert(ownedNft.creatorRoyalty, 'Royalty not found')
      assert.equal(ownedNft.creatorRoyalty, creatorRoyalty)
    })
  }
}
