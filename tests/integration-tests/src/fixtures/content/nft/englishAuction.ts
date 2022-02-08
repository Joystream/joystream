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
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug('Start NFT auction')
    const startingPrice = new BN(10) // TODO - read min/max bounds from runtime (?)
    const minimalBidStep = new BN(10) // TODO - read min/max bounds from runtime (?)
    const auctionParams = this.api.createAuctionParameters('English', startingPrice, minimalBidStep)
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
    const auctionDuration = 5 // TODO: read from runtime
    const extensionPeriod = 5 // TODO: read from runtime

    const waitBlocks = Math.min(auctionDuration, extensionPeriod + this.participants.length) + 1
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Complete auction')
    await this.api.claimWonEnglishAuction(winner.account, winner.memberId.toNumber(), this.videoId)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, winner)
  }
}
