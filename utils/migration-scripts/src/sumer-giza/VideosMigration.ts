import { VideoMetadata } from '@joystream/metadata-protobuf'
import { VideoFieldsFragment } from './sumer-query-node/generated/queries'
import _ from 'lodash'
import { createType } from '@joystream/types'
import Long from 'long'
import { VideoCreationParameters, VideoId } from '@joystream/types/content'
import moment from 'moment'
import { VIDEO_THUMB_TARGET_SIZE } from './ImageResizer'
import { AssetsMigration, AssetsMigrationConfig, AssetsMigrationParams } from './AssetsMigration'
import { MigrationResult } from './BaseMigration'
import { Logger } from 'winston'
import { createLogger } from '../logging'

export type VideosMigrationConfig = AssetsMigrationConfig & {
  videoBatchSize: number
}

export type VideosMigrationParams = AssetsMigrationParams & {
  config: VideosMigrationConfig
  videoIds: number[]
  channelsMap: Map<number, number>
  forcedChannelOwner: { id: string; controllerAccount: string } | undefined
}

export class VideosMigration extends AssetsMigration {
  name = 'Videos migration'
  protected config: VideosMigrationConfig
  protected channelsMap: Map<number, number>
  protected videoIds: number[]
  protected forcedChannelOwner: { id: string; controllerAccount: string } | undefined
  protected logger: Logger

  public constructor({ api, queryNodeApi, config, videoIds, channelsMap, forcedChannelOwner }: VideosMigrationParams) {
    super({ api, queryNodeApi, config })
    this.config = config
    this.channelsMap = channelsMap
    this.videoIds = videoIds
    this.forcedChannelOwner = forcedChannelOwner
    this.logger = createLogger(this.name)
  }

  private getNewChannelId(oldChannelId: number): number {
    const newChannelId = this.channelsMap.get(oldChannelId)
    if (!newChannelId) {
      throw new Error(`Missing new channel id for channel ${oldChannelId} in the channelMap!`)
    }
    return newChannelId
  }

  protected async migrateBatch(videos: VideoFieldsFragment[]): Promise<void> {
    const { api } = this
    const txs = _.flatten(await Promise.all(videos.map((v) => this.prepareVideo(v))))
    const result = await api.sendExtrinsic(this.sudo, api.tx.utility.batch(txs))
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
      this.assetsManager.queueUploadsFromEvents(dataObjectsUploadedEvents)
    }
  }

  public async run(): Promise<MigrationResult> {
    await this.init()
    const {
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
      this.logger.info(`Fetching a batch of ${idsBatch.length} videos...`)
      const videosBatch = (await this.queryNodeApi.getVideosByIds(idsBatch)).sort(
        (a, b) => parseInt(a.id) - parseInt(b.id)
      )
      if (videosBatch.length < idsBatch.length) {
        this.logger.warn(
          `Some videos were not be found: ${_.difference(
            idsBatch,
            videosBatch.map((v) => parseInt(v.id))
          )}`
        )
      }
      await this.executeBatchMigration(videosBatch)
      await this.assetsManager.processQueuedUploads()
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
      mediaDataObject,
      mediaMetadata,
      publishedBeforeJoystream,
      thumbnailPhotoDataObject,
      title,
      channel: { ownerMember, id: oldChannelId },
    } = this.getVideoData(video)

    const channelId = this.getNewChannelId(parseInt(oldChannelId))

    const assetsToPrepare = {
      thumbnail: { data: thumbnailPhotoDataObject || undefined, targetSize: VIDEO_THUMB_TARGET_SIZE },
      video: { data: mediaDataObject || undefined },
    }
    const preparedAssets = await this.assetsManager.prepareAssets(assetsToPrepare)
    const meta = new VideoMetadata({
      title,
      description,
      category: categoryId ? Long.fromString(categoryId) : undefined,
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
              expected_data_size_fee: this.assetsManager.dataObjectFeePerMB,
            }
          : null,
        meta: `0x${Buffer.from(VideoMetadata.encode(meta).finish()).toString('hex')}`,
      }
    )
    const feesToCover = this.assetsManager.calcDataObjectsFee(assetsParams)
    return [
      api.tx.balances.transferKeepAlive(ownerMember.controllerAccount, feesToCover),
      api.tx.sudo.sudoAs(
        ownerMember.controllerAccount,
        api.tx.content.createVideo({ Member: ownerMember.id }, channelId, videoCreationParams)
      ),
    ]
  }
}
