import { getInputJson } from '../../helpers/InputOutput'
import { VideoFileMetadata, VideoInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import UploadCommandBase from '../../base/UploadCommandBase'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import {
  PalletContentVideoUpdateParametersRecord as VideoUpdateParameters,
  PalletContentIterableEnumsChannelActionPermission as ChannelActionPermission,
} from '@polkadot/types/lookup'
import { VideoInputSchema } from '../../schemas/ContentDirectory'
import { ContentMetadata, IVideoMetadata, VideoMetadata } from '@joystream/metadata-protobuf'
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
    let meta = asValidatedMetadata(VideoMetadata, videoInput)
    const { enableComments } = videoInput

    // Video assets
    const { videoPath, thumbnailPhotoPath, subtitles } = videoInput
    const [resolvedVideoAssets, videoAssetIndices] = await this.resolveAndValidateAssets(
      { videoPath, thumbnailPhotoPath },
      input
    )
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.video = videoAssetIndices.videoPath
    meta.thumbnailPhoto = videoAssetIndices.thumbnailPhotoPath

    // Subtitle assets
    let subtitleAssetIndex = Object.values(videoAssetIndices).filter((v) => v !== undefined).length
    const resolvedSubtitleAssets = (
      await Promise.all(
        (subtitles || []).map(async (subtitleInputParameters, i) => {
          const { subtitleAssetPath } = subtitleInputParameters
          const [[resolvedAsset]] = await this.resolveAndValidateAssets({ subtitleAssetPath }, input)
          // Set assets indices in the metadata
          if (meta.subtitles && resolvedAsset) {
            meta.subtitles[i].newAsset = subtitleAssetIndex++
          }
          return resolvedAsset
        })
      )
    ).filter((r) => r)

    // Try to get updated video file metadata
    if (videoAssetIndices.videoPath !== undefined) {
      const videoFileMetadata = await this.getVideoFileMetadata(resolvedVideoAssets[videoAssetIndices.videoPath].path)
      this.log('Video media file parameters established:', videoFileMetadata)
      meta = this.setVideoMetadataDefaults(meta, videoFileMetadata)
    }

    // Prepare and send the extrinsic
    const serializedMeta = metadataToBytes(VideoMetadata, meta)
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const assetsToUpload = await this.prepareAssetsForExtrinsic([...resolvedVideoAssets, ...resolvedSubtitleAssets])
    const assetsToRemove = await this.getAssetsToRemove(
      videoId,
      videoAssetIndices.videoPath,
      videoAssetIndices.thumbnailPhotoPath
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
      newMeta: metadataToBytes(ContentMetadata, { videoMetadata: meta }),
      assetsToRemove,
      storageBucketsNumWitness: await this.getStorageBucketsNumWitness(video.inChannel),
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

    const VideoUpdatedEvent = this.getEvent(result, 'content', 'VideoUpdated')
    const objectIds = VideoUpdatedEvent.data[3]

    if (objectIds.size !== (assetsToUpload?.objectCreationList.length || 0)) {
      this.error('Unexpected number of video assets in VideoUpdated event!', {
        exit: ExitCodes.UnexpectedRuntimeState,
      })
    }

    if (objectIds.size) {
      await this.uploadAssets(
        `dynamic:channel:${video.inChannel.toString()}`,
        [...objectIds].map((id, index) => ({
          dataObjectId: id,
          path: [...resolvedVideoAssets, ...resolvedSubtitleAssets][index].path,
        })),
        input
      )
    }
  }
}
