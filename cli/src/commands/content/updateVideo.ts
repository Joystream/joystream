import { getInputJson } from '../../helpers/InputOutput'
import { VideoInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import UploadCommandBase from '../../base/UploadCommandBase'
import { flags } from '@oclif/command'
import { CreateInterface, createType } from '@joystream/types'
import { VideoUpdateParameters } from '@joystream/types/content'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
import { VideoMetadata } from '@joystream/metadata-protobuf'
import { DataObjectInfoFragment } from '../../graphql/generated/queries'
import BN from 'bn.js'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'

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

  async getAssetsToRemove(
    videoId: number,
    videoIndex: number | undefined,
    thumbnailIndex: number | undefined
  ): Promise<string[]> {
    let assetsToRemove: DataObjectInfoFragment[] = []
    if (videoIndex !== undefined || thumbnailIndex !== undefined) {
      const currentAssets = await this.getQNApi().dataObjectsByVideoId(videoId.toString())
      const currentThumbs = currentAssets.filter((a) => a.type.__typename === 'DataObjectTypeVideoThumbnail')
      const currentMedias = currentAssets.filter((a) => a.type.__typename === 'DataObjectTypeVideoMedia')
      if (currentThumbs.length && thumbnailIndex !== undefined) {
        assetsToRemove = assetsToRemove.concat(currentThumbs)
      }
      if (currentMedias.length && videoIndex !== undefined) {
        assetsToRemove = assetsToRemove.concat(currentMedias)
      }
      if (assetsToRemove.length) {
        this.log(`\nData objects to be removed due to replacement:`)
        assetsToRemove.forEach((a) => this.log(`- ${a.id} (${a.type.__typename})`))
        const totalPrize = assetsToRemove.reduce((sum, { deletionPrize }) => sum.add(new BN(deletionPrize)), new BN(0))
        this.log(`Total deletion prize: ${chalk.cyanBright(formatBalance(totalPrize))}\n`)
      }
    }

    return assetsToRemove.map((a) => a.id)
  }

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
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(videoId, videoIndex, thumbnailPhotoIndex)
    const videoUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assets_to_upload: assetsToUpload,
      new_meta: metadataToBytes(VideoMetadata, meta),
      assets_to_remove: createType('BTreeSet<DataObjectId>', assetsToRemove),
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), newMetadata: meta, assetsToRemove })
    )

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
