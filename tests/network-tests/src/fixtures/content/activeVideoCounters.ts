import { assert } from 'chai'
import { Api } from '../../Api'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Utils } from '../../utils'
import { JoystreamCLI, ICreatedVideoData } from '../../cli/joystream'
import { Maybe } from '../../graphql/generated/schema'

/**
  Fixture that test Joystream content can be created, is reflected in query node,
  and channel and categories counts their active videos properly.

  Assuming all videos start in channel, video category, and channel category respectively
  `channelIds[0]`, `channelCategoryIds[0]`, and `videoCategoryIds[0]`.
*/
export class ActiveVideoCountersFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private channelIds: number[]
  private videosData: ICreatedVideoData[]
  private videoCategoryIds: string[]

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    channelIds: number[],
    videosData: ICreatedVideoData[],
    videoCategoryIds: string[]
  ) {
    super(api, query)
    this.cli = cli
    this.channelIds = channelIds
    this.videosData = videosData
    this.videoCategoryIds = videoCategoryIds
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const videoCount = this.videosData.length
    // const videoCategoryCount = this.videoCategoryIds.length
    // const channelCount = this.channelIds.length
    // const channelCategoryCount = this.channelCategoryIds.length

    // check channel and categories con are counted as active

    this.debug('Checking channels active video counters')
    await this.assertCounterMatch('channel', this.channelIds[0], videoCount)

    this.debug('Checking video categories active video counters')
    await this.assertCounterMatch('videoCategory', this.videoCategoryIds[0], videoCount)

    // move channel to different channel category and video to different videoCategory

    const oneMovedItemCount = 1

    this.debug('Move video to different video category')
    await this.cli.updateVideo(this.videosData[0].videoId, {
      category: this.videoCategoryIds[1], // move from category 1 to category 2
    })

    // check counters of channel category and video category with newly moved in video/channel

    this.debug('Checking video categories active video counters (2)')
    await this.assertCounterMatch('videoCategory', this.videoCategoryIds[1], oneMovedItemCount)

    /** Giza doesn't support changing channels - uncomment this on later releases where it's supported

    // move one video to another channel

    this.debug('Move video to different channel')
    await this.cli.updateVideo(videosData[0].videoId, {
      channel: channelIds[1], // move from channel 1 to channel 2
    })

    // check counter of channel with newly moved video

    this.debug('Checking channels active video counters (2)')
    await this.assertCounterMatch('channel', channelIds[0], videoCount - oneMovedItemCount)
    await this.assertCounterMatch('channel', channelIds[1], oneMovedItemCount)

    // end
    */

    const oneDeletedItemCount = 1
    this.debug('Delete video')
    await this.cli.deleteVideo(this.videosData[0].videoId)

    // check that deletion works
    this.debug('Checking channels active video counter decreased')
    await this.assertCounterMatch('channel', this.channelIds[0], videoCount - oneDeletedItemCount)

    this.debug('Done')
  }

  /**
    Asserts a channel, or a video/channel categories have their active videos counter set properly
    in Query node.
  */
  private async assertCounterMatch(
    entityName: 'channel' | 'videoCategory',
    entityId: number | string,
    expectedCount: number
  ) {
    const getterName = `${entityName}ById` as 'channelById' | 'videoCategoryById'
    await this.query.tryQueryWithTimeout(
      () => this.query[getterName](entityId.toString()) as Promise<Maybe<{ id: string; activeVideosCounter: number }>>,
      (entity) => {
        Utils.assert(entity)
        assert.equal(entity.activeVideosCounter, expectedCount)
      }
    )
  }
}
