import { WsProvider } from '@polkadot/api'
import { QueryNodeApi } from './sumer-query-node/api'
import { RuntimeApi } from '../RuntimeApi'
import { VideosMigration } from './VideosMigration'
import { ChannelMigration } from './ChannelsMigration'

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
    const forcedChannelOwner = await this.getForcedChannelOwner()
    const { idsMap: channelsMap, videoIds } = await new ChannelMigration({
      api,
      queryNodeApi,
      config,
      forcedChannelOwner,
    }).run()
    await new VideosMigration({
      api,
      queryNodeApi,
      config,
      channelsMap,
      videoIds,
      forcedChannelOwner,
    }).run()
  }
}
