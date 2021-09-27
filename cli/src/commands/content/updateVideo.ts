import { getInputJson } from '../../helpers/InputOutput'
import { VideoInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import UploadCommandBase from '../../base/UploadCommandBase'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { VideoUpdateParameters } from '@joystream/types/content'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
import { VideoMetadata } from '@joystream/metadata-protobuf'

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
    const account = await this.getRequiredSelectedAccount()
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const actor = await this.getChannelOwnerActor(channel)
    const memberId = await this.getRequiredMemberId(true)
    await this.requestAccountDecoding(account)

    const videoInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)
    const meta = asValidatedMetadata(VideoMetadata, videoInput)

    const { videoPath, thumbnailPhotoPath } = videoInput
    const inputPaths = [videoPath, thumbnailPhotoPath].filter((p) => p !== undefined) as string[]
    const resolvedAssets = await this.resolveAndValidateAssets(inputPaths, input)
    // Set assets indexes in the metadata
    const [videoIndex, thumbnailPhotoIndex] = this.assetsIndexes([videoPath, thumbnailPhotoPath], inputPaths)
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.video = videoIndex
    meta.thumbnailPhoto = thumbnailPhotoIndex

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const videoUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assets,
      new_meta: metadataToBytes(VideoMetadata, meta),
    }

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), newMetadata: meta }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(account, 'content', 'updateVideo', [
      actor,
      videoId,
      videoUpdateParameters,
    ])
    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        account,
        memberId,
        `dynamic:channel:${video.in_channel.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
