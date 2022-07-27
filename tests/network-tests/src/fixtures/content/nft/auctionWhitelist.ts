import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembersAndCurators'
import { Utils } from '../../../utils'

export class NftAuctionWhitelistFixture extends BaseQueryNodeFixture {
  private author: IMember
  private channelId: number
  private participants: IMember[]

  constructor(api: Api, query: QueryNodeApi, author: IMember, channelId: number, participants: IMember[]) {
    super(api, query)
    this.author = author
    this.channelId = channelId
    this.participants = participants
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const nonExistingMember = 1_000_000 // some really big number higher than any member's id

    const whitelistedParticipants = [this.participants[0], this.participants[1]]
    const forbiddenParticipant = this.participants[2]

    // add nonexisting member to whitelist to test this feature
    // runtime allows that so this shouldn't cause any problems
    const whitelistedMemberIds = whitelistedParticipants
      .map((item) => item.memberId.toNumber())
      .concat([nonExistingMember])

    this.debug('Create video with NFT being auctioned')
    const { auctionParams, minimalBidStep: bidAmount } = await this.api.createEnglishAuctionParameters(
      whitelistedMemberIds
    )

    const videoCreationResponse = await this.api.createVideoWithNft(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.channelId,
      auctionParams
    )

    const event = await this.api.getEvent(videoCreationResponse, 'content', 'VideoCreated')
    const videoId = event.data[2].toNumber()

    // place bids by whitelisted participants - should succeed
    for (let i = 0; i < whitelistedParticipants.length; i++) {
      const validBidResponse = await this.api.bidInEnglishAuction(
        whitelistedParticipants[i].account,
        whitelistedParticipants[i].memberId.toNumber(),
        videoId,
        bidAmount.muln(i + 1)
      )

      Utils.assert(!validBidResponse.dispatchError)
    }

    // place bid by non-whitelisted participant - should fail
    const invalidBidResponse = await this.api.bidInEnglishAuction(
      forbiddenParticipant.account,
      forbiddenParticipant.memberId.toNumber(),
      videoId,
      bidAmount
    )

    Utils.assert(!!invalidBidResponse.dispatchError)
  }
}
