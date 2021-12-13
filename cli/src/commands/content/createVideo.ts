import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { VideoInputParameters, VideoFileMetadata } from '../../Types'
import { createTypeFromConstructor } from '@joystream/types'
import { flags } from '@oclif/command'
import { VideoCreationParameters } from '@joystream/types/content'
import { IVideoMetadata, VideoMetadata } from '@joystream/metadata-protobuf'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class CreateVideoCommand extends UploadCommandBase {
  static description = 'Create video under specific channel inside content directory.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the Channel',
    }),
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
  }

  setVideoMetadataDefaults(metadata: IVideoMetadata, videoFileMetadata: VideoFileMetadata): void {
    const videoMetaToIntegrate = {
      duration: videoFileMetadata.duration,
      mediaPixelWidth: videoFileMetadata.width,
      mediaPixelHeight: videoFileMetadata.height,
    }
    const mediaTypeMetaToIntegrate = {
      codecName: videoFileMetadata.codecName,
      container: videoFileMetadata.container,
      mimeMediaType: videoFileMetadata.mimeType,
    }
    integrateMeta(metadata, videoMetaToIntegrate, ['duration', 'mediaPixelWidth', 'mediaPixelHeight'])
    integrateMeta(metadata.mediaType || {}, mediaTypeMetaToIntegrate, ['codecName', 'container', 'mimeMediaType'])
  }

  async run(): Promise<void> {
    const { input, channelId, context } = this.parse(CreateVideoCommand).flags

    // Get context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const [memberId] = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    // Get input from file
    const videoCreationParametersInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)
    const meta = asValidatedMetadata(VideoMetadata, videoCreationParametersInput)

    // Assets
    const { videoPath, thumbnailPhotoPath } = videoCreationParametersInput
    const assetsPaths = [videoPath, thumbnailPhotoPath].filter((a) => a !== undefined) as string[]
    const resolvedAssets = await this.resolveAndValidateAssets(assetsPaths, input)
    // Set assets indexes in the metadata
    const [videoIndex, thumbnailPhotoIndex] = this.assetsIndexes([videoPath, thumbnailPhotoPath], assetsPaths)
    meta.video = videoIndex
    meta.thumbnailPhoto = thumbnailPhotoIndex

    // Try to get video file metadata
    if (videoIndex !== undefined) {
      const videoFileMetadata = await this.getVideoFileMetadata(resolvedAssets[videoIndex].path)
      this.log('Video media file parameters established:', videoFileMetadata)
      this.setVideoMetadataDefaults(meta, videoFileMetadata)
    }

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const videoCreationParameters = createTypeFromConstructor(VideoCreationParameters, {
      assets,
      meta: metadataToBytes(VideoMetadata, meta),
    })

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), metadata: meta }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createVideo', [
      actor,
      channelId,
      videoCreationParameters,
    ])

    const videoCreatedEvent = this.findEvent(result, 'content', 'VideoCreated')
    this.log(
      chalk.green(`Video with id ${chalk.cyanBright(videoCreatedEvent?.data[2].toString())} successfully created!`)
    )

    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        keypair,
        memberId.toNumber(),
        `dynamic:channel:${channelId.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
