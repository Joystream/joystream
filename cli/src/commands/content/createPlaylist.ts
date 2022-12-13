import { ContentMetadata, PlaylistMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { PlaylistInputSchema } from '../../schemas/ContentDirectory'
import { PlaylistInputParameters } from '../../Types'
import ExitCodes from '../../ExitCodes'

export default class CreatePlaylistCommand extends UploadCommandBase {
  static description = 'Create playlist under specific channel inside content directory.'
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
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
    ...UploadCommandBase.flags,
  }

  async run(): Promise<void> {
    const { input, channelId, context } = this.parse(CreatePlaylistCommand).flags

    // Get context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const keypair = await this.getDecodedPair(address)

    // Get input from file
    const playlistCreationParametersInput = await getInputJson<PlaylistInputParameters>(input, PlaylistInputSchema)
    const meta = asValidatedMetadata(PlaylistMetadata, playlistCreationParametersInput)
    const { enableComments } = playlistCreationParametersInput

    // Assets
    const { thumbnailPhotoPath } = playlistCreationParametersInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets({ thumbnailPhotoPath }, input)
    // Set assets indices in the metadata
    meta.thumbnailPhoto = assetIndices.thumbnailPhotoPath

    const expectedVideoStateBloatBond = await this.getApi().videoStateBloatBond()
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const playlistCreationParameters = createType('PalletContentVideoCreationParametersRecord', {
      assets,
      meta: metadataToBytes(ContentMetadata, { playlistMetadata: meta }),
      expectedVideoStateBloatBond,
      expectedDataObjectStateBloatBond,
      autoIssueNft: null,
      storageBucketsNumWitness: await this.getStorageBucketsNumWitness(channelId),
    })

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), metadata: meta, enableComments }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createVideo', [
      actor,
      channelId,
      playlistCreationParameters,
    ])

    const [, , playlistId, , dataObjects] = this.getEvent(result, 'content', 'VideoCreated').data
    this.log(chalk.green(`Playlist with id ${chalk.cyanBright(playlistId.toString())} successfully created!`))

    if (dataObjects.size !== (assets?.objectCreationList.length || 0)) {
      this.error('Unexpected number of channel assets in ChannelCreated event!', {
        exit: ExitCodes.UnexpectedRuntimeState,
      })
    }

    if (dataObjects.size) {
      await this.uploadAssets(
        `dynamic:channel:${channelId.toString()}`,
        [...dataObjects].map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
