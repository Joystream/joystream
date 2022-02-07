import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { Debugger, extendDebug } from '../../../Debugger'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { PlaceBidsInAuctionFixture } from './placeBidsInAuction'
import { Utils } from '../../../utils'
import { assertNftOwner } from './utils'
import BN from 'bn.js'

export class AuctionCancelationsFixture extends BaseQueryNodeFixture {
  private debug: Debugger.Debugger
  private cli: JoystreamCLI
  private videoId: number
  private author: IMember
  private participant: IMember

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    videoId: number,
    author: IMember,
    participant: IMember
  ) {
    super(api, query)
    this.cli = cli
    this.videoId = videoId
    this.author = author
    this.participant = participant
    this.debug = extendDebug('fixture:AuctionCancelationsFixture')
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
    const auctionParams = this.api.createAuctionParameters('Open', startingPrice, minimalBidStep)
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
    const bidLockDuration = 2 // TODO - read min/max bounds from runtime and set min value here (?)

    const waitBlocks = bidLockDuration + 1
    await Utils.wait(this.api.getBlockDuration().muln(waitBlocks).toNumber())

    this.debug('Cancel bid')
    await this.api.cancelOpenAuctionBid(this.participant.account, this.participant.memberId.toNumber(), this.videoId)

    this.debug('Cancel auction')
    await this.api.cancelNftAuction(this.author.account, this.author.memberId.toNumber(), this.videoId)

    this.debug(`Check NFT ownership haven't change`)
    await assertNftOwner(this.query, this.videoId, this.author)
  }
}
