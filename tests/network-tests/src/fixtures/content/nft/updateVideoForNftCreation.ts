import { assert } from 'chai'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { IMember } from '../createMembers'
import { assertNftOwner } from './utils'

export class UpdateVideoForNftCreationFixture extends BaseQueryNodeFixture {
  private author: IMember
  private videoId: number

  constructor(api: Api, query: QueryNodeApi, author: IMember, videoId: number) {
    super(api, query)
    this.author = author
    this.videoId = videoId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Update video for creating NFT in auctioned state')
    const { auctionParams } = await this.api.createAuctionParameters('English')

    const response = await this.api.updateVideoForNftCreation(
      this.author.keyringPair.address,
      this.author.memberId.toNumber(),
      this.videoId,
      auctionParams
    )

    const event = await this.api.getEvent(response, 'content', 'VideoUpdated')

    this.debug('Check NFT ownership')
    await assertNftOwner(this.query, event.data[1].toNumber(), this.author, (ownedNft) => {
      assert.equal(ownedNft.transactionalStatus.__typename, 'TransactionalStatusAuction')
    })
  }
}
