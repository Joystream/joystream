import { Logger } from 'winston'
import { createLogger } from '../logging'
import { MAX_RESULTS_PER_QUERY, QueryNodeApi } from './giza-query-node/api'
import {
  ChannelCategoryFieldsFragment,
  ChannelConnectionFieldsFragment,
  ChannelFieldsFragment,
  VideoCategoryFieldsFragment,
  VideoConnectionFieldsFragment,
  VideoFieldsFragment,
} from './giza-query-node/generated/queries'

export type SnapshotManagerParams = {
  queryNodeApi: QueryNodeApi
}

export type ContentDirectorySnapshot = {
  channelCategories: ChannelCategoryFieldsFragment[]
  videoCategories: VideoCategoryFieldsFragment[]
  channels: ChannelFieldsFragment[]
  videos: VideoFieldsFragment[]
}

export class SnapshotManager {
  name = 'Snapshot Manager'
  protected logger: Logger
  protected queryNodeApi: QueryNodeApi

  public constructor(params: SnapshotManagerParams) {
    this.queryNodeApi = params.queryNodeApi
    this.logger = createLogger(this.name)
  }

  private sortEntitiesByIds<T extends { id: string }>(entities: T[]): T[] {
    return entities.sort((a, b) => parseInt(a.id) - parseInt(b.id))
  }

  public async getChannels(): Promise<ChannelFieldsFragment[]> {
    let lastCursor: string | undefined
    let currentPage: ChannelConnectionFieldsFragment
    let channels: ChannelFieldsFragment[] = []
    do {
      this.logger.info(`Fetching a page of up to ${MAX_RESULTS_PER_QUERY} channels...`)
      currentPage = await this.queryNodeApi.getChannelsPage(lastCursor)
      channels = channels.concat(currentPage.edges.map((e) => e.node))
      this.logger.info(`Total ${channels.length} channels fetched`)
      lastCursor = currentPage.pageInfo.endCursor || undefined
    } while (currentPage.pageInfo.hasNextPage)
    this.logger.info('Finished channels fetching')

    return this.sortEntitiesByIds(channels)
  }

  public async getVideos(): Promise<VideoFieldsFragment[]> {
    let lastCursor: string | undefined
    let currentPage: VideoConnectionFieldsFragment
    let videos: VideoFieldsFragment[] = []
    do {
      this.logger.info(`Fetching a page of up to ${MAX_RESULTS_PER_QUERY} videos...`)
      currentPage = await this.queryNodeApi.getVideosPage(lastCursor)
      videos = videos.concat(currentPage.edges.map((e) => e.node))
      this.logger.info(`Total ${videos.length} videos fetched`)
      lastCursor = currentPage.pageInfo.endCursor || undefined
    } while (currentPage.pageInfo.hasNextPage)
    this.logger.info('Finished videos fetching')

    return this.sortEntitiesByIds(videos)
  }

  public async createSnapshot(): Promise<ContentDirectorySnapshot> {
    const channelCategories = this.sortEntitiesByIds(await this.queryNodeApi.getChannelCategories())
    this.logger.info(`Total ${channelCategories.length} channel categories fetched`)
    const videoCategories = this.sortEntitiesByIds(await this.queryNodeApi.getVideoCategories())
    this.logger.info(`Total ${videoCategories.length} video categories fetched`)
    const channels = await this.getChannels()
    const videos = await this.getVideos()
    return { channelCategories, videoCategories, videos, channels }
  }
}
