import { ContentMetadata, PlaylistMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import { VideoUpdateParameters } from '@joystream/types/content'
import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import { DataObjectInfoFragment } from '../../graphql/generated/queries'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { PlaylistInputSchema } from '../../schemas/ContentDirectory'
import { PlaylistInputParameters } from '../../Types'

export default class UpdatePlaylistCommand extends UploadCommandBase {
  static description = 'Update playlist under specific id.'
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
      name: 'playlistId',
      required: true,
      description: 'ID of the Playlist',
    },
  ]

  async getAssetsToRemove(playlistId: number, thumbnailIndex: number | undefined): Promise<string[]> {
    let assetsToRemove: DataObjectInfoFragment[] = []
    if (thumbnailIndex) {
      const currentAssets = await this.getQNApi().dataObjectsByVideoId(playlistId.toString())
      const currentThumbs = currentAssets.filter((a) => a.type.__typename === 'DataObjectTypePlaylistThumbnail')
      if (currentThumbs.length && thumbnailIndex !== undefined) {
        assetsToRemove = assetsToRemove.concat(currentThumbs)
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
      args: { playlistId },
    } = this.parse(UpdatePlaylistCommand)

    // Context
    const playlist = await this.getApi().videoById(playlistId) // video & playlist have same runtime representation
    const channel = await this.getApi().channelById(playlist.in_channel.toNumber())
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const { id: memberId } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    const playlistInput = await getInputJson<PlaylistInputParameters>(input, PlaylistInputSchema)
    const meta = asValidatedMetadata(PlaylistMetadata, playlistInput)
    const { enableComments } = playlistInput

    const { thumbnailPhotoPath } = playlistInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    // Preare and send the extrinsic
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(playlistId, assetIndices.thumbnailPhotoPath)
    const playlistUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assets_to_upload: assetsToUpload,
      new_meta: metadataToBytes(ContentMetadata, { playlistMetadata: meta }),
      assets_to_remove: createType('BTreeSet<DataObjectId>', assetsToRemove),
      enable_comments: enableComments,
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), newMetadata: meta, assetsToRemove, enableComments })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateVideo', [
      actor,
      playlistId,
      playlistUpdateParameters,
    ])
    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        keypair,
        memberId.toNumber(),
        `dynamic:channel:${playlist.in_channel.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
