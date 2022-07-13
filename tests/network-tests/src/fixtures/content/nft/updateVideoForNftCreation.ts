import { Utils } from '../../../utils'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { assertNftOwner } from './utils'

export class UpdateVideoForNftCreationFixture extends BaseQueryNodeFixture {
  private author: IMember
  private videoIds: number[]

  constructor(api: Api, query: QueryNodeApi, author: IMember, videoIds: number[]) {
    super(api, query)
    this.author = author
    this.videoIds = videoIds
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    // SCENARIO 1
    this.debug('Update video for creating NFT (in Idle state)')
    const videoUpdatedWithNftResponse = await this.api.updateVideoForNftCreation(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoIds[0]
    )

    const videoUpdatedWithNftEvent = await this.api.getEvent(videoUpdatedWithNftResponse, 'content', 'VideoUpdated')

    this.debug('Check NFT ownership')
    await assertNftOwner(this.query, videoUpdatedWithNftEvent.data[1].toNumber(), this.author)

    // SCENARIO 2
    this.debug('Update video for creating NFT in auctioned state')
    const { auctionParams } = await this.api.createEnglishAuctionParameters()

    const response = await this.api.updateVideoForNftCreation(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoIds[1],
      auctionParams
    )

    const event = await this.api.getEvent(response, 'content', 'VideoUpdated')

    this.debug('Check NFT ownership')
    await assertNftOwner(this.query, event.data[1].toNumber(), this.author, (ownedNft) => {
      Utils.assert(ownedNft.transactionalStatusAuction, 'NFT not in auctioned state')
    })
  }
}
