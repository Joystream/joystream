import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { assertNftOwner } from './utils'

export class NftDirectOfferFixture extends BaseQueryNodeFixture {
  private videoId: number
  private author: IMember
  private participant: IMember

  constructor(api: Api, query: QueryNodeApi, videoId: number, author: IMember, participant: IMember) {
    super(api, query)
    this.videoId = videoId
    this.author = author
    this.participant = participant
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Issue video NFT')
    await this.api.issueNft(this.author.keyringPair.address, this.author.memberId.toNumber(), this.videoId)

    this.debug('Offer NFT')
    await this.api.offerNft(
      this.author.keyringPair.address,
      this.videoId,
      this.author.memberId.toNumber(),
      this.participant.memberId.toNumber()
    )

    this.debug('Accept offer')
    await this.api.acceptIncomingOffer(this.participant.keyringPair.address, this.videoId)

    this.debug('Check NFT ownership change')
    await assertNftOwner(this.query, this.videoId, this.participant)
  }
}
