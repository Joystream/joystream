import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { Debugger, extendDebug } from '../../../Debugger'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import BN from 'bn.js'

export class PlaceBidsInAuctionFixture extends BaseQueryNodeFixture {
  private debug: Debugger.Debugger
  private participants: IMember[]
  private startingPrice: BN
  private minimalBidStep: BN
  private videoId: number

  constructor(
    api: Api,
    query: QueryNodeApi,
    participants: IMember[],
    startingPrice: BN,
    minimalBidStep: BN,
    videoId: number
  ) {
    super(api, query)
    this.participants = participants
    this.startingPrice = startingPrice
    this.minimalBidStep = minimalBidStep
    this.videoId = videoId
    this.debug = extendDebug('fixture:PlaceBidsInAuctionFixture')
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Put bids in auction')
    const winner = this.participants[this.participants.length - 1]

    for (const [index, participant] of this.participants.entries()) {
      const bidAmount = this.startingPrice.add(this.minimalBidStep.mul(new BN(index)))
      this.debug('Bid-' + index)
      await this.api.bidInNftAuction(participant.account, participant.memberId.toNumber(), this.videoId, bidAmount)
    }
  }
}
