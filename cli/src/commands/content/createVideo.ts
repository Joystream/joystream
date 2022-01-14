import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { VideoInputParameters, VideoFileMetadata } from '../../Types'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { VideoCreationParameters } from '@joystream/types/content'
import { IVideoMetadata, VideoMetadata } from '@joystream/metadata-protobuf'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
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

  setVideoMetadataDefaults(metadata: IVideoMetadata, videoFileMetadata: VideoFileMetadata): IVideoMetadata {
    return {
      duration: videoFileMetadata.duration,
      mediaPixelWidth: videoFileMetadata.width,
      mediaPixelHeight: videoFileMetadata.height,
      mediaType: {
        codecName: videoFileMetadata.codecName,
        container: videoFileMetadata.container,
        mimeMediaType: videoFileMetadata.mimeType,
      },
      ...metadata,
    }
  }

  async run(): Promise<void> {
    const { input, channelId, context } = this.parse(CreateVideoCommand).flags

    // Get context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const { id: memberId } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    // Get input from file
    const videoCreationParametersInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)
    let meta = asValidatedMetadata(VideoMetadata, videoCreationParametersInput)

    // Assets
    const { videoPath, thumbnailPhotoPath } = videoCreationParametersInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ videoPath, thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    meta.video = assetIndices.videoPath
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    // Try to get video file metadata
    if (assetIndices.videoPath !== undefined) {
      const videoFileMetadata = await this.getVideoFileMetadata(resolvedAssets[assetIndices.videoPath].path)
      this.log('Video media file parameters established:', videoFileMetadata)
      meta = this.setVideoMetadataDefaults(meta, videoFileMetadata)
    }

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const videoCreationParameters = createType<VideoCreationParameters, 'VideoCreationParameters'>(
      'VideoCreationParameters',
      {
        assets,
        meta: metadataToBytes(VideoMetadata, meta),
      }
    )

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
