import { WsProvider } from '@polkadot/api'
import { QueryNodeApi } from './giza-query-node/api'
import { RuntimeApi } from '../RuntimeApi'
import { VideosMigration } from './VideosMigration'
import { ChannelMigration } from './ChannelsMigration'
import { UploadManager } from './UploadManager'
import { ChannelCategoriesMigration } from './ChannelCategoriesMigration'
import { VideoCategoriesMigration } from './VideoCategoriesMigration'

export type ContentMigrationConfig = {
  queryNodeUri: string
  wsProviderEndpointUri: string
  sudoUri: string
  channelIds: number[]
  dataDir: string
  channelBatchSize: number
  videoBatchSize: number
  forceChannelOwnerMemberId: number | undefined
  preferredDownloadSpEndpoints?: string[]
  uploadSpBucketId: number
  uploadSpEndpoint: string
  migrationStatePath: string
  excludeVideoIds: number[]
}

export class ContentMigration {
  private api: RuntimeApi
  private queryNodeApi: QueryNodeApi
  private config: ContentMigrationConfig

  constructor(config: ContentMigrationConfig) {
    const { queryNodeUri, wsProviderEndpointUri } = config
    const provider = new WsProvider(wsProviderEndpointUri)
    this.api = new RuntimeApi({ provider })
    this.queryNodeApi = new QueryNodeApi(queryNodeUri)
    this.config = config
  }

  private async getForcedChannelOwner(): Promise<{ id: string; controllerAccount: string } | undefined> {
    const { forceChannelOwnerMemberId } = this.config
    if (forceChannelOwnerMemberId !== undefined) {
      const ownerMember = await this.api.query.members.membershipById(forceChannelOwnerMemberId)
      if (ownerMember.isEmpty) {
        throw new Error(`Membership by id ${forceChannelOwnerMemberId} not found!`)
      }
      return {
        id: forceChannelOwnerMemberId.toString(),
        controllerAccount: ownerMember.controller_account.toString(),
      }
    }
    return undefined
  }

  public async run(): Promise<void> {
    const { api, queryNodeApi, config } = this
    await this.api.isReadyOrError
    const { idsMap: channelCategoriesMap } = await new ChannelCategoriesMigration({ api, queryNodeApi, config }).run()
    const { idsMap: videoCategoriesMap } = await new VideoCategoriesMigration({ api, queryNodeApi, config }).run()
    const forcedChannelOwner = await this.getForcedChannelOwner()
    const uploadManager = await UploadManager.create({
      api,
      config,
    })
    const { idsMap: channelsMap, videoIds } = await new ChannelMigration({
      api,
      queryNodeApi,
      config,
      forcedChannelOwner,
      uploadManager,
      categoriesMap: channelCategoriesMap,
    }).run()
    await new VideosMigration({
      api,
      queryNodeApi,
      config,
      channelsMap,
      videoIds,
      forcedChannelOwner,
      uploadManager,
      categoriesMap: videoCategoriesMap,
    }).run()
  }
}
