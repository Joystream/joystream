import { Logger } from 'winston'
import { createLogger } from '../logging'
import { MAX_RESULTS_PER_QUERY, QueryNodeApi } from './giza-query-node/api'
import {
  ChannelCategoryFieldsFragment,
  ChannelConnectionFieldsFragment,
  ChannelFieldsFragment,
  MembershipConnectionFieldsFragment,
  MembershipFieldsFragment,
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

export type MembershipsSnapshot = {
  members: MembershipFieldsFragment[]
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

  public async getMemberships(): Promise<MembershipFieldsFragment[]> {
    let lastCursor: string | undefined
    let currentPage: MembershipConnectionFieldsFragment
    let members: MembershipFieldsFragment[] = []
    do {
      this.logger.info(`Fetching a page of up to ${MAX_RESULTS_PER_QUERY} members...`)
      currentPage = await this.queryNodeApi.getMembershipsPage(lastCursor)
      members = members.concat(currentPage.edges.map((e) => e.node))
      this.logger.info(`Total ${members.length} members fetched`)
      lastCursor = currentPage.pageInfo.endCursor || undefined
    } while (currentPage.pageInfo.hasNextPage)
    this.logger.info('Finished members fetching')

    return this.sortEntitiesByIds(members)
  }

  public async createContentDirectorySnapshot(): Promise<ContentDirectorySnapshot> {
    const channelCategories = this.sortEntitiesByIds(await this.queryNodeApi.getChannelCategories())
    const videoCategories = this.sortEntitiesByIds(await this.queryNodeApi.getVideoCategories())
    const channels = await this.getChannels()
    const videos = await this.getVideos()
    return { channelCategories, videoCategories, videos, channels }
  }

  public async createMembershipsSnapshot(): Promise<MembershipsSnapshot> {
    const members = await this.getMemberships()
    return {
      members,
    }
  }
}
