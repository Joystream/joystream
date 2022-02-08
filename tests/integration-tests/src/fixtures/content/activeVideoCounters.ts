import { assert } from 'chai'
import { ApolloQueryResult } from '@apollo/client'
import { Api } from '../../Api'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { BuyMembershipHappyCaseFixture } from '../membership'
import { KeyringPair } from '@polkadot/keyring/types'
import { Bytes } from '@polkadot/types'
import { QueryNodeApi } from '../../QueryNodeApi'
import BN from 'bn.js'
import { Worker, WorkerId } from '@joystream/types/working-group'

import {
  getMemberDefaults,
  getChannelCategoryDefaults,
  getChannelDefaults,
  getVideoDefaults,
  getVideoCategoryDefaults,
} from './contentTemplates'
import { JoystreamCLI, ICreatedVideoData } from '../../cli/joystream'
import * as path from 'path'

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
  private channelCategoryIds: number[]
  private videoCategoryIds: number[]

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    channelIds: number[],
    videosData: ICreatedVideoData[],
    channelCategoryIds: number[],
    videoCategoryIds: number[]
  ) {
    super(api, query)
    this.cli = cli
    this.channelIds = channelIds
    this.videosData = videosData
    this.channelCategoryIds = channelCategoryIds
    this.videoCategoryIds = videoCategoryIds
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const videoCount = this.videosData.length
    const videoCategoryCount = this.videoCategoryIds.length
    const channelCount = this.channelIds.length
    const channelCategoryCount = this.channelCategoryIds.length

    // check channel and categories con are counted as active

    this.debug('Checking channels active video counters')
    await this.assertCounterMatch('channels', this.channelIds[0], videoCount)

    this.debug('Checking channel categories active video counters')
    await this.assertCounterMatch('channelCategories', this.channelCategoryIds[0], videoCount)

    this.debug('Checking video categories active video counters')
    await this.assertCounterMatch('videoCategories', this.videoCategoryIds[0], videoCount)

    // move channel to different channel category and video to different videoCategory

    const oneMovedItemCount = 1
    this.debug('Move channel to different channel category')
    await this.cli.updateChannel(this.channelIds[0], {
      category: this.channelCategoryIds[1], // move from category 1 to category 2
    })

    this.debug('Move video to different video category')
    await this.cli.updateVideo(this.videosData[0].videoId, {
      category: this.videoCategoryIds[1], // move from category 1 to category 2
    })

    // check counters of channel category and video category with newly moved in video/channel

    this.debug('Checking channel categories active video counters (2)')
    await this.assertCounterMatch('channelCategories', this.channelCategoryIds[1], videoCount)

    this.debug('Checking video categories active video counters (2)')
    await this.assertCounterMatch('videoCategories', this.videoCategoryIds[1], oneMovedItemCount)

    /** Giza doesn't support changing channels - uncomment this on later releases where it's supported

    // move one video to another channel

    this.debug('Move video to different channel')
    await this.cli.updateVideo(videosData[0].videoId, {
      channel: channelIds[1], // move from channel 1 to channel 2
    })

    // check counter of channel with newly moved video

    this.debug('Checking channels active video counters (2)')
    await this.assertCounterMatch('channels', channelIds[0], videoCount - oneMovedItemCount)
    await this.assertCounterMatch('channels', channelIds[1], oneMovedItemCount)

    // end
    */

    this.debug('Done')
  }

  /**
    Asserts a channel, or a video/channel categories have their active videos counter set properly
    in Query node.
  */
  private async assertCounterMatch(
    entityName: 'channels' | 'channelCategories' | 'videoCategories',
    entityId: number,
    expectedCount: number
  ) {
    const getterName = `get${entityName[0].toUpperCase()}${entityName.slice(1)}` as
      | 'getChannels'
      | 'getChannelCategories'
      | 'getVideoCategories'
    await this.query.tryQueryWithTimeout(
      () => this.query[getterName](),
      (tmpEntity) => {
        const entities = (tmpEntity as any).data[entityName]
        assert(entities.length > 0) // some entities were loaded

        const entity = entities.find((item: any) => item.id === entityId.toString())

        // all videos created in this fixture should be active and belong to first entity
        assert(entity.activeVideosCounter === expectedCount)
      }
    )
  }
}
