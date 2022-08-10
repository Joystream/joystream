import { getInputJson } from '../../helpers/InputOutput'
import { VideoInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import UploadCommandBase from '../../base/UploadCommandBase'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import {
  PalletContentVideoUpdateParametersRecord as VideoUpdateParameters,
  PalletContentChannelActionPermission as ChannelActionPermission,
} from '@polkadot/types/lookup'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
import { VideoMetadata } from '@joystream/metadata-protobuf'
import { DataObjectInfoFragment } from '../../graphql/generated/queries'
import BN from 'bn.js'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class UpdateVideoCommand extends UploadCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
    ...UploadCommandBase.flags,
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
  ): Promise<number[]> {
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
        const totalStateBloatBond = assetsToRemove.reduce(
          (sum, { stateBloatBond }) => sum.add(new BN(stateBloatBond)),
          new BN(0)
        )
        this.log(`Total state bloat bond: ${chalk.cyanBright(formatBalance(totalStateBloatBond))}\n`)
      }
    }

    return assetsToRemove.map((a) => Number(a.id))
  }

  async run(): Promise<void> {
    const {
      flags: { input, context },
      args: { videoId },
    } = this.parse(UpdateVideoCommand)

    // Context
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.inChannel.toNumber())
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const keypair = await this.getDecodedPair(address)

    const videoInput = await getInputJson<VideoInputParameters>(input, VideoInputSchema)
    const meta = asValidatedMetadata(VideoMetadata, videoInput)
    const { enableComments } = videoInput

    const { videoPath, thumbnailPhotoPath } = videoInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ videoPath, thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.video = assetIndices.videoPath
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    // Prepare and send the extrinsic
    const serializedMeta = metadataToBytes(VideoMetadata, meta)
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(
      videoId,
      assetIndices.videoPath,
      assetIndices.thumbnailPhotoPath
    )

    // Ensure actor is authorized to perform video update
    const requiredPermissions: ChannelActionPermission['type'][] = []
    if (assetsToUpload || assetsToRemove.length) {
      requiredPermissions.push('ManageVideoAssets')
    }
    if (serializedMeta.length) {
      requiredPermissions.push('UpdateVideoMetadata')
    }
    if (!(await this.hasRequiredChannelAgentPermissions(actor, channel, requiredPermissions))) {
      this.error(
        `Only channelOwner or collaborator with ${requiredPermissions} permissions can update video ${videoId}!`,
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    }

    const videoUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      expectedDataObjectStateBloatBond,
      autoIssueNft: null,
      assetsToUpload,
      newMeta: metadataToBytes(VideoMetadata, meta),
      assetsToRemove,
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), newMetadata: meta, assetsToRemove, enableComments })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateVideo', [
      actor,
      videoId,
      videoUpdateParameters,
    ])
    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUpdated')
    if (dataObjectsUploadedEvent) {
      const [, objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        `dynamic:channel:${video.inChannel.toString()}`,
        [...objectIds.values()].map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
