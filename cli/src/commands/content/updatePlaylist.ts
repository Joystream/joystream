import { ContentMetadata, PlaylistMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface } from '@joystream/types'
import { flags } from '@oclif/command'
import { PalletContentVideoUpdateParametersRecord as VideoUpdateParameters } from '@polkadot/types/lookup'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
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

  async getAssetsToRemove(playlistId: number, thumbnailIndex: number | undefined): Promise<BN[]> {
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
        const totalPrize = assetsToRemove.reduce(
          (sum, { stateBloatBond }) => sum.add(new BN(stateBloatBond)),
          new BN(0)
        )
        this.log(`Total deletion prize: ${chalk.cyanBright(formatBalance(totalPrize))}\n`)
      }
    }

    return assetsToRemove.map((a) => new BN(a.id))
  }

  async run(): Promise<void> {
    const {
      flags: { input, context },
      args: { playlistId },
    } = this.parse(UpdatePlaylistCommand)

    // Context
    const playlist = await this.getApi().videoById(playlistId) // video & playlist have same runtime representation
    const channel = await this.getApi().channelById(playlist.inChannel.toNumber())
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const keypair = await this.getDecodedPair(address)

    const playlistInput = await getInputJson<PlaylistInputParameters>(input, PlaylistInputSchema)
    const meta = asValidatedMetadata(PlaylistMetadata, playlistInput)

    const { thumbnailPhotoPath } = playlistInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    // Prepare and send the extrinsic
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(playlistId, assetIndices.thumbnailPhotoPath)
    const playlistUpdateParameters: CreateInterface<VideoUpdateParameters> = {
      assetsToUpload,
      assetsToRemove,
      autoIssueNft: null,
      expectedDataObjectStateBloatBond,
      newMeta: metadataToBytes(ContentMetadata, { playlistMetadata: meta }),
      storageBucketsNumWitness: await this.getStorageBucketsNumWitness(playlist.inChannel),
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), newMetadata: meta, assetsToRemove })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateVideo', [
      actor,
      playlistId,
      playlistUpdateParameters,
    ])

    const playlistUpdatedEvent = this.getEvent(result, 'content', 'VideoUpdated')
    const objectIds = playlistUpdatedEvent.data[3]

    if (objectIds.size !== (assetsToUpload?.objectCreationList.length || 0)) {
      this.error('Unexpected number of video assets in VideoUpdated event!', {
        exit: ExitCodes.UnexpectedRuntimeState,
      })
    }

    if (objectIds.size) {
      await this.uploadAssets(
        `dynamic:channel:${playlist.inChannel.toString()}`,
        [...objectIds].map((id, index) => ({
          dataObjectId: id,
          path: resolvedAssets[index].path,
        })),
        input
      )
    }
  }
}
