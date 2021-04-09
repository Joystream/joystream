import { getInputJson } from '../../helpers/InputOutput'
import { VideoInputParameters } from '../../Types'
import { metadataToBytes, videoMetadataFromInput } from '../../helpers/serialization'
import UploadCommandBase from '../../base/UploadCommandBase'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { VideoUpdateParameters } from '@joystream/types/content'
import { VideoInputSchema } from '../../json-schemas/ContentDirectory'

export default class UpdateVideoCommand extends UploadCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  static args = [
    {
      name: 'videoId',
      required: true,
      description: 'ID of the Video',
    },
  ]

  async run() {
    const {
      flags: { input },
      args: { videoId },
    } = this.parse(UpdateVideoCommand)

    // Context
    const currentAccount = await this.getRequiredSelectedAccount()
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(currentAccount)

    const videoInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)

    const meta = videoMetadataFromInput(videoInput)
    const { videoPath, thumbnailPhotoPath } = videoInput
    const inputPaths = [videoPath, thumbnailPhotoPath].filter((p) => p !== undefined) as string[]
    const inputAssets = await this.prepareInputAssets(inputPaths, input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    if (videoPath) {
      meta.setVideo(0)
    }
    if (thumbnailPhotoPath) {
      meta.setThumbnailPhoto(videoPath ? 1 : 0)
    }

    const videoUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assets,
      new_meta: metadataToBytes(meta),
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, newMetadata: meta.toObject() }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideo', [actor, videoId, videoUpdateParameters])

    await this.uploadAssets(inputAssets, input)
  }
}
