import { WsProvider } from '@polkadot/api'
import { QueryNodeApi } from './sumer-query-node/api'
import { RuntimeApi } from '../RuntimeApi'
import { VideosMigration } from './VideosMigration'
import { ChannelCategoriesMigration } from './ChannelCategoriesMigration'
import { VideoCategoriesMigration } from './VideoCategoriesMigration'
import { ChannelMigration } from './ChannelsMigration'

export type ContentMigrationConfig = {
  queryNodeUri: string
  wsProviderEndpointUri: string
  sudoUri: string
  channelIds: number[]
  dataDir: string
  channelBatchSize: number
  videoBatchSize: number
  dev: boolean
  preferredDownloadSpEndpoints?: string[]
  uploadSpBucketId: number
  uploadSpEndpoint: string
  uploadMemberControllerUri: string
  uploadMemberId: number
  migrationStatePath: string
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

  public async run(): Promise<void> {
    const { api, queryNodeApi, config } = this
    await this.api.isReadyOrError
    const { idsMap: channelCategoriesMap } = await new ChannelCategoriesMigration({ api, queryNodeApi, config }).run()
    const { idsMap: videoCategoriesMap } = await new VideoCategoriesMigration({ api, queryNodeApi, config }).run()
    const { idsMap: channelsMap, videoIds } = await new ChannelMigration({
      api,
      queryNodeApi,
      config,
      categoriesMap: channelCategoriesMap,
    }).run()
    await new VideosMigration({
      api,
      queryNodeApi,
      config,
      categoriesMap: videoCategoriesMap,
      channelsMap,
      videoIds,
    }).run()
  }
}
