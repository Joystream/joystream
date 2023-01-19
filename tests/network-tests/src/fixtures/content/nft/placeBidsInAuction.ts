import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembersAndCurators'
import BN from 'bn.js'
import { EventDetails, EventType } from 'src/types'

export class PlaceBidsInAuctionFixture extends BaseQueryNodeFixture {
  private participants: IMember[]
  private startingPrice: BN
  private minimalBidStep: BN
  private videoId: number
  private auctionType: 'Open' | 'English'
  private events: EventDetails<EventType<'content', 'AuctionBidMade'>>[] = []

  constructor(
    api: Api,
    query: QueryNodeApi,
    participants: IMember[],
    startingPrice: BN,
    minimalBidStep: BN,
    videoId: number,
    auctionType: 'Open' | 'English'
  ) {
    super(api, query)
    this.participants = participants
    this.startingPrice = startingPrice
    this.minimalBidStep = minimalBidStep
    this.videoId = videoId
    this.auctionType = auctionType
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Put bids in auction')
    const winner = this.participants[this.participants.length - 1]

    for (const [index, participant] of this.participants.entries()) {
      const bidAmount = this.calcBidAmount(index)
      this.debug('Bid-' + index)

      await this.placeBid(participant, bidAmount)
    }
  }

  public calcBidAmount(index: number): BN {
    return this.startingPrice.add(this.minimalBidStep.muln(index))
  }

  private async placeBid(participant: IMember, bidAmount: BN): Promise<void> {
    if (this.auctionType === 'Open') {
      await this.api.bidInOpenAuction(participant.account, participant.memberId.toNumber(), this.videoId, bidAmount)
      return
    }

    const result = await this.api.bidInEnglishAuction(
      participant.account,
      participant.memberId.toNumber(),
      this.videoId,
      bidAmount
    )
    this.events.push(await this.api.getEventDetails(result, 'content', 'AuctionBidMade'))
  }

  public getLastBidBlock(): number {
    return this.events[this.events.length - 1].blockNumber
  }
}
