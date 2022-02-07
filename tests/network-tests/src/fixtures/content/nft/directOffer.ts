import { Api } from '../../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../../Fixture'
import { JoystreamCLI } from '../../../cli/joystream'
import { Debugger, extendDebug } from '../../../Debugger'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { assertNftOwner } from './utils'

export class NftDirectOfferFixture extends BaseQueryNodeFixture {
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
    this.debug = extendDebug('fixture:NftDirectOfferFixture')
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
