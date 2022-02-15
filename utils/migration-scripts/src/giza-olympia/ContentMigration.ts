import { WsProvider } from '@polkadot/api'
import { RuntimeApi } from '../RuntimeApi'
import { VideosMigration } from './VideosMigration'
import { ChannelMigration } from './ChannelsMigration'
import { UploadManager } from './UploadManager'
import { ChannelCategoriesMigration } from './ChannelCategoriesMigration'
import { VideoCategoriesMigration } from './VideoCategoriesMigration'
import { ContentDirectorySnapshot } from './SnapshotManager'
import { readFileSync } from 'fs'

export type ContentMigrationConfig = {
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
  snapshotFilePath: string
}

export class ContentMigration {
  private api: RuntimeApi
  private config: ContentMigrationConfig

  constructor(config: ContentMigrationConfig) {
    const { wsProviderEndpointUri } = config
    const provider = new WsProvider(wsProviderEndpointUri)
    this.api = new RuntimeApi({ provider })
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

  private loadSnapshot(): ContentDirectorySnapshot {
    const snapshotJson = readFileSync(this.config.snapshotFilePath).toString()
    return JSON.parse(snapshotJson) as ContentDirectorySnapshot
  }

  public async run(): Promise<void> {
    const { api, config } = this
    await this.api.isReadyOrError
    const snapshot = this.loadSnapshot()
    const { idsMap: channelCategoriesMap } = await new ChannelCategoriesMigration({ api, config, snapshot }).run()
    const { idsMap: videoCategoriesMap } = await new VideoCategoriesMigration({ api, config, snapshot }).run()
    const forcedChannelOwner = await this.getForcedChannelOwner()
    const uploadManager = await UploadManager.create({
      api,
      config,
    })
    const { idsMap: channelsMap, videoIds } = await new ChannelMigration({
      api,
      config,
      snapshot,
      forcedChannelOwner,
      uploadManager,
      categoriesMap: channelCategoriesMap,
    }).run()
    await new VideosMigration({
      api,
      config,
      snapshot,
      channelsMap,
      videoIds,
      forcedChannelOwner,
      uploadManager,
      categoriesMap: videoCategoriesMap,
    }).run()
  }
}
