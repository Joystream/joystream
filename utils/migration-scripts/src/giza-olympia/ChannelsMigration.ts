import { UploadMigration, UploadMigrationConfig, UploadMigrationParams } from './UploadMigration'
import { ChannelMetadata } from '@joystream/metadata-protobuf'
import { ChannelFieldsFragment } from './giza-query-node/generated/queries'
import { createType } from '@joystream/types'
import Long from 'long'
import { ChannelCreationParameters } from '@joystream/types/content'
import { ChannelId } from '@joystream/types/common'
import _ from 'lodash'
import { MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { SubmittableExtrinsic } from '@polkadot/api/types'

export type ChannelsMigrationConfig = UploadMigrationConfig & {
  channelIds: number[]
  channelBatchSize: number
  forceChannelOwnerMemberId: number | undefined
  excludeVideoIds: number[]
}

export type ChannelsMigrationParams = UploadMigrationParams & {
  config: ChannelsMigrationConfig
  forcedChannelOwner: { id: string; controllerAccount: string } | undefined
  categoriesMap: Map<number, number>
}

export type ChannelsMigrationResult = MigrationResult & {
  videoIds: number[]
}

export class ChannelMigration extends UploadMigration {
  name = 'Channels migration'
  protected config: ChannelsMigrationConfig
  protected categoriesMap: Map<number, number>
  protected videoIds: number[] = []
  protected forcedChannelOwner: { id: string; controllerAccount: string } | undefined
  protected logger: Logger

  public constructor(params: ChannelsMigrationParams) {
    super(params)
    this.config = params.config
    this.forcedChannelOwner = params.forcedChannelOwner
    this.categoriesMap = params.categoriesMap
    this.logger = createLogger(this.name)
  }

  private getNewCategoryId(oldCategoryId: string | null | undefined): Long | undefined {
    if (typeof oldCategoryId !== 'string') {
      return undefined
    }
    const newCategoryId = this.categoriesMap.get(parseInt(oldCategoryId))
    return newCategoryId ? Long.fromNumber(newCategoryId) : undefined
  }

  private getChannelOwnerMember({ id, ownerMember }: ChannelFieldsFragment) {
    if (!ownerMember) {
      throw new Error(`Chanel ownerMember missing: ${id}. Only member-owned channels are supported!`)
    }

    if (this.forcedChannelOwner) {
      return this.forcedChannelOwner
    }

    return ownerMember
  }

  protected async migrateBatch(tx: SubmittableExtrinsic<'promise'>, channels: ChannelFieldsFragment[]): Promise<void> {
    const { api } = this
    const result = await api.sendExtrinsic(this.sudo, tx)
    const channelCreatedEvents = api.findEvents(result, 'content', 'ChannelCreated')
    const newChannelIds: ChannelId[] = channelCreatedEvents.map((e) => e.data[1])
    if (channelCreatedEvents.length !== channels.length) {
      this.extractFailedMigrations(result, channels)
    }
    const newChannelMapEntries: [number, number][] = []
    let newChannelIdIndex = 0
    channels.forEach(({ id }) => {
      if (this.failedMigrations.has(parseInt(id))) {
        return
      }
      const newChannelId = newChannelIds[newChannelIdIndex++].toNumber()
      this.idsMap.set(parseInt(id), newChannelId)
      newChannelMapEntries.push([parseInt(id), newChannelId])
    })
    if (newChannelMapEntries.length) {
      this.logger.info('Channel map entries added!', { newChannelMapEntries })
      const dataObjectsUploadedEvents = this.api.findEvents(result, 'storage', 'DataObjectsUploaded')
      this.uploadManager.queueUploadsFromEvents(dataObjectsUploadedEvents)
    }
  }

  public async run(): Promise<ChannelsMigrationResult> {
    await this.init()
    const {
      api,
      config: { channelIds, channelBatchSize },
    } = this
    const ids = channelIds.sort((a, b) => a - b)
    while (ids.length) {
      const idsBatch = ids.splice(0, channelBatchSize)
      this.logger.info(`Preparing a batch of ${idsBatch.length} channels...`)
      const channelsBatch = this.snapshot.channels.filter((c) => idsBatch.includes(parseInt(c.id)))
      if (channelsBatch.length < idsBatch.length) {
        this.logger.warn(
          `Some channels were not be found: ${_.difference(
            idsBatch,
            channelsBatch.map((c) => parseInt(c.id))
          )}`
        )
      }
      const channelsToMigrate = channelsBatch.filter((c) => !this.idsMap.has(parseInt(c.id)))
      if (channelsToMigrate.length < channelsBatch.length) {
        this.logger.info(
          `${channelsToMigrate.length ? 'Some' : 'All'} channels in this batch were already migrated ` +
            `(${channelsBatch.length - channelsToMigrate.length}/${channelsBatch.length})`
        )
      }
      if (channelsToMigrate.length) {
        const calls = _.flatten(await Promise.all(channelsToMigrate.map((c) => this.prepareChannel(c))))
        const batchTx = api.tx.utility.batch(calls)
        await this.executeBatchMigration(batchTx, channelsToMigrate)
        await this.uploadManager.processQueuedUploads()
      }
      const videoIdsToMigrate: number[] = channelsBatch.reduce<number[]>(
        (res, { id, videos }) =>
          this.idsMap.has(parseInt(id))
            ? res.concat(videos.map((v) => parseInt(v.id)).filter((id) => !this.config.excludeVideoIds.includes(id)))
            : res,
        []
      )
      this.videoIds = this.videoIds.concat(videoIdsToMigrate)
      if (videoIdsToMigrate.length) {
        this.logger.info(`Added ${videoIdsToMigrate.length} video ids to the list of videos to migrate`)
      }
    }
    return {
      ...this.getResult(),
      videoIds: [...this.videoIds],
    }
  }

  private async prepareChannel(channel: ChannelFieldsFragment) {
    const { api } = this
    const { avatarPhoto, coverPhoto, title, description, categoryId, isPublic, language, collaborators } = channel

    const ownerMember = this.getChannelOwnerMember(channel)

    const assetsToPrepare = {
      avatar: avatarPhoto || undefined,
      coverPhoto: coverPhoto || undefined,
    }
    const preparedAssets = await this.uploadManager.prepareAssets(assetsToPrepare)
    const meta = new ChannelMetadata({
      title,
      description,
      category: this.getNewCategoryId(categoryId),
      avatarPhoto: preparedAssets.avatar?.index,
      coverPhoto: preparedAssets.coverPhoto?.index,
      isPublic,
      language: language?.iso,
    })
    const assetsParams = Object.values(preparedAssets)
      .sort((a, b) => a.index - b.index)
      .map((a) => a.params)
    const channelCreationParams = createType<ChannelCreationParameters, 'ChannelCreationParameters'>(
      'ChannelCreationParameters',
      {
        assets: assetsParams.length
          ? {
              object_creation_list: assetsParams,
              expected_data_size_fee: this.uploadManager.dataObjectFeePerMB,
            }
          : null,
        meta: `0x${Buffer.from(ChannelMetadata.encode(meta).finish()).toString('hex')}`,
        collaborators: collaborators.map(({ id }) => parseInt(id)),
        reward_account: channel.rewardAccount,
      }
    )
    const feesToCover = this.uploadManager.calcDataObjectsFee(assetsParams)
    return [
      api.tx.balances.transferKeepAlive(ownerMember.controllerAccount, feesToCover),
      api.tx.sudo.sudoAs(
        ownerMember.controllerAccount,
        api.tx.content.createChannel({ Member: ownerMember.id }, channelCreationParams)
      ),
    ]
  }
}
