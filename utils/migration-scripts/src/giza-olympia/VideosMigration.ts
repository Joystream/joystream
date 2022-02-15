import { VideoMetadata } from '@joystream/metadata-protobuf'
import { VideoFieldsFragment } from './giza-query-node/generated/queries'
import _ from 'lodash'
import { createType } from '@joystream/types'
import Long from 'long'
import { VideoCreationParameters, VideoId } from '@joystream/types/content'
import moment from 'moment'
import { UploadMigration, UploadMigrationConfig, UploadMigrationParams } from './UploadMigration'
import { MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { SubmittableExtrinsic } from '@polkadot/api/types'

export type VideosMigrationConfig = UploadMigrationConfig & {
  videoBatchSize: number
}

export type VideosMigrationParams = UploadMigrationParams & {
  config: VideosMigrationConfig
  videoIds: number[]
  channelsMap: Map<number, number>
  forcedChannelOwner: { id: string; controllerAccount: string } | undefined
  categoriesMap: Map<number, number>
}

export class VideosMigration extends UploadMigration {
  name = 'Videos migration'
  protected config: VideosMigrationConfig
  protected categoriesMap: Map<number, number>
  protected channelsMap: Map<number, number>
  protected videoIds: number[]
  protected forcedChannelOwner: { id: string; controllerAccount: string } | undefined
  protected logger: Logger

  public constructor(params: VideosMigrationParams) {
    super(params)
    this.config = params.config
    this.channelsMap = params.channelsMap
    this.videoIds = params.videoIds
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

  private getNewChannelId(oldChannelId: number): number {
    const newChannelId = this.channelsMap.get(oldChannelId)
    if (!newChannelId) {
      throw new Error(`Missing new channel id for channel ${oldChannelId} in the channelMap!`)
    }
    return newChannelId
  }

  protected async migrateBatch(tx: SubmittableExtrinsic<'promise'>, videos: VideoFieldsFragment[]): Promise<void> {
    const { api } = this
    const result = await api.sendExtrinsic(this.sudo, tx)
    const videoCreatedEvents = api.findEvents(result, 'content', 'VideoCreated')
    const newVideoIds: VideoId[] = videoCreatedEvents.map((e) => e.data[2])
    if (videoCreatedEvents.length !== videos.length) {
      this.extractFailedMigrations(result, videos)
    }
    const newVideoMapEntries: [number, number][] = []
    let newVideoIdIndex = 0
    videos.forEach(({ id }) => {
      if (this.failedMigrations.has(parseInt(id))) {
        return
      }
      const newVideoId = newVideoIds[newVideoIdIndex++].toNumber()
      this.idsMap.set(parseInt(id), newVideoId)
      newVideoMapEntries.push([parseInt(id), newVideoId])
    })
    if (newVideoMapEntries.length) {
      this.logger.info('Video map entries added!', { newVideoMapEntries })
      const dataObjectsUploadedEvents = api.findEvents(result, 'storage', 'DataObjectsUploaded')
      this.uploadManager.queueUploadsFromEvents(dataObjectsUploadedEvents)
    }
  }

  public async run(): Promise<MigrationResult> {
    await this.init()
    const {
      api,
      videoIds,
      config: { videoBatchSize },
    } = this
    const idsToMigrate = videoIds.filter((id) => !this.idsMap.has(id)).sort((a, b) => a - b)
    if (idsToMigrate.length < videoIds.length) {
      const alreadyMigratedVideosNum = videoIds.length - idsToMigrate.length
      this.logger.info(
        (idsToMigrate.length ? `${alreadyMigratedVideosNum}/${videoIds.length}` : 'All') +
          ' videos already migrated, skippping...'
      )
    }
    while (idsToMigrate.length) {
      const idsBatch = idsToMigrate.splice(0, videoBatchSize)
      this.logger.info(`Preparing a batch of ${idsBatch.length} videos...`)
      const videosBatch = this.snapshot.videos.filter((v) => idsBatch.includes(parseInt(v.id)))
      if (videosBatch.length < idsBatch.length) {
        this.logger.warn(
          `Some videos were not be found: ${_.difference(
            idsBatch,
            videosBatch.map((v) => parseInt(v.id))
          )}`
        )
      }
      const calls = _.flatten(await Promise.all(videosBatch.map((v) => this.prepareVideo(v))))
      const batchTx = api.tx.utility.batch(calls)
      await this.executeBatchMigration(batchTx, videosBatch)
      await this.uploadManager.processQueuedUploads()
    }
    return this.getResult()
  }

  private getVideoData(video: VideoFieldsFragment) {
    const { id, channel } = video

    if (!channel) {
      throw new Error(`Channel data missing for video: ${id}`)
    }

    if (!channel.ownerMember) {
      throw new Error(`Channel ownerMember missing for video ${id}`)
    }

    let { ownerMember } = channel
    if (this.forcedChannelOwner) {
      ownerMember = this.forcedChannelOwner
    }

    return { ...video, channel: { ...channel, ownerMember } }
  }

  private async prepareVideo(video: VideoFieldsFragment) {
    const { api } = this

    const {
      categoryId,
      description,
      duration,
      hasMarketing,
      isExplicit,
      isPublic,
      language,
      license,
      media,
      mediaMetadata,
      publishedBeforeJoystream,
      thumbnailPhoto,
      title,
      channel: { ownerMember, id: oldChannelId },
    } = this.getVideoData(video)

    const channelId = this.getNewChannelId(parseInt(oldChannelId))

    const assetsToPrepare = {
      thumbnail: thumbnailPhoto || undefined,
      video: media || undefined,
    }
    const preparedAssets = await this.uploadManager.prepareAssets(assetsToPrepare)
    const meta = new VideoMetadata({
      title,
      description,
      category: this.getNewCategoryId(categoryId),
      duration,
      hasMarketing,
      isExplicit,
      isPublic,
      language: language?.iso,
      license: license,
      mediaPixelHeight: mediaMetadata?.pixelHeight,
      mediaPixelWidth: mediaMetadata?.pixelWidth,
      mediaType: mediaMetadata?.encoding,
      publishedBeforeJoystream: {
        isPublished: !!publishedBeforeJoystream,
        date: moment(publishedBeforeJoystream).format('YYYY-MM-DD'),
      },
      thumbnailPhoto: preparedAssets.thumbnail?.index,
      video: preparedAssets.video?.index,
    })
    const assetsParams = Object.values(preparedAssets)
      .sort((a, b) => a.index - b.index)
      .map((a) => a.params)
    const videoCreationParams = createType<VideoCreationParameters, 'VideoCreationParameters'>(
      'VideoCreationParameters',
      {
        assets: assetsParams.length
          ? {
              object_creation_list: assetsParams,
              expected_data_size_fee: this.uploadManager.dataObjectFeePerMB,
            }
          : null,
        meta: `0x${Buffer.from(VideoMetadata.encode(meta).finish()).toString('hex')}`,
      }
    )
    const feesToCover = this.uploadManager.calcDataObjectsFee(assetsParams)
    return [
      api.tx.balances.transferKeepAlive(ownerMember.controllerAccount, feesToCover),
      api.tx.sudo.sudoAs(
        ownerMember.controllerAccount,
        api.tx.content.createVideo({ Member: ownerMember.id }, channelId, videoCreationParams)
      ),
    ]
  }
}
