import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { videoMetadataFromInput, metadataToBytes } from '../../helpers/serialization'
import { VideoInputParameters, VideoFileMetadata } from '../../Types'
import { CreateInterface } from '@joystream/types'
import { flags } from '@oclif/command'
import { VideoCreationParameters } from '@joystream/types/content'
import { MediaType, VideoMetadata } from '@joystream/content-metadata-protobuf'
import ExitCodes from '../../ExitCodes'

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
    const videoCreationParametersInput = await getInputJson<VideoInputParameters>(input)

    const meta = videoMetadataFromInput(videoCreationParametersInput)

    // Assets
    const { videoPath, thumbnailPhotoPath } = videoCreationParametersInput
    if (!videoPath || !thumbnailPhotoPath) {
      // TODO: Handle with json schema validation?
      this.error('Invalid input! videoPath and thumbnailVideoPath are required!', { exit: ExitCodes.InvalidInput })
    }
    const inputAssets = await this.prepareInputAssets([videoPath, thumbnailPhotoPath], input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    meta.setVideo(0)
    meta.setThumbnailPhoto(1)

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

    await this.sendAndFollowNamedTx(account, 'content', 'createVideo', [actor, channelId, videoCreationParameters])

    // Upload assets
    await this.uploadAssets(inputAssets)
    // TODO: Reupload option if failed?
  }
}
