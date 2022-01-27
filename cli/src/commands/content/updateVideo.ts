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
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class UpdateVideoCommand extends UploadCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
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

  async run(): Promise<void> {
    const {
      flags: { input, context },
      args: { videoId },
    } = this.parse(UpdateVideoCommand)

    // Context
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const [memberId] = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    const videoInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)
    const meta = asValidatedMetadata(VideoMetadata, videoInput)

    const { videoPath, thumbnailPhotoPath } = videoInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ videoPath, thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.video = assetIndices.videoPath
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    // Preare and send the extrinsic
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(
      videoId,
      assetIndices.videoPath,
      assetIndices.thumbnailPhotoPath
    )
    const videoUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assets_to_upload: assetsToUpload,
      new_meta: metadataToBytes(VideoMetadata, meta),
      assets_to_remove: createType('BTreeSet<DataObjectId>', assetsToRemove),
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), newMetadata: meta, assetsToRemove })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateVideo', [
      actor,
      videoId,
      videoUpdateParameters,
    ])
    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        keypair,
        memberId.toNumber(),
        `dynamic:channel:${video.in_channel.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
