import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { videoMetadataFromInput, metadataToBytes } from '../../helpers/serialization'
import { VideoInputParameters, VideoFileMetadata } from '../../Types'
import { CreateInterface } from '@joystream/types'
import { flags } from '@oclif/command'
import { VideoCreationParameters } from '@joystream/types/content'
import { MediaType, VideoMetadata } from '@joystream/content-metadata-protobuf'
import { VideoInputSchema } from '../../json-schemas/ContentDirectory'
import chalk from 'chalk'

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
  }

  setVideoMetadataDefaults(metadata: VideoMetadata, videoFileMetadata: VideoFileMetadata) {
    const metaObj = metadata.toObject()
    metadata.setDuration((metaObj.duration || videoFileMetadata.duration) as number)
    metadata.setMediaPixelWidth((metaObj.mediaPixelWidth || videoFileMetadata.width) as number)
    metadata.setMediaPixelHeight((metaObj.mediaPixelHeight || videoFileMetadata.height) as number)

    const fileMediaType = new MediaType()
    fileMediaType.setCodecName(videoFileMetadata.codecName as string)
    fileMediaType.setContainer(videoFileMetadata.container)
    fileMediaType.setMimeMediaType(videoFileMetadata.mimeType)
    metadata.setMediaType(metadata.getMediaType() || fileMediaType)
  }

  async run() {
    const { input, channelId } = this.parse(CreateVideoCommand).flags

    // Get context
    const account = await this.getRequiredSelectedAccount()
    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(account)

    // Get input from file
    const videoCreationParametersInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)

    const meta = videoMetadataFromInput(videoCreationParametersInput)

    // Assets
    const { videoPath, thumbnailPhotoPath } = videoCreationParametersInput
    const assetsPaths = [videoPath, thumbnailPhotoPath].filter((a) => a !== undefined) as string[]
    const inputAssets = await this.prepareInputAssets(assetsPaths, input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    if (videoPath) {
      meta.setVideo(0)
    }
    if (thumbnailPhotoPath) {
      meta.setThumbnailPhoto(videoPath ? 1 : 0)
    }

    // Try to get video file metadata
    const videoFileMetadata = await this.getVideoFileMetadata(inputAssets[0].path)
    this.log('Video media file parameters established:', videoFileMetadata)
    this.setVideoMetadataDefaults(meta, videoFileMetadata)

    // Create final extrinsic params and send the extrinsic
    const videoCreationParameters: CreateInterface<VideoCreationParameters> = {
      assets,
      meta: metadataToBytes(meta),
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, metadata: meta.toObject() }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(account, 'content', 'createVideo', [actor, channelId, videoCreationParameters])
    if (result) {
      const event = this.findEvent(result, 'content', 'VideoCreated')
      this.log(chalk.green(`Video with id ${chalk.cyanBright(event?.data[2].toString())} successfully created!`))
    }

    // Upload assets
    await this.uploadAssets(inputAssets, input)
  }
}
