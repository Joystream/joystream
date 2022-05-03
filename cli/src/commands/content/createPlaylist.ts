import { ContentMetadata, PlaylistMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { VideoCreationParameters, VideoId } from '@joystream/types/content'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { PlaylistInputSchema } from '../../schemas/ContentDirectory'
import { PlaylistInputParameters } from '../../Types'

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
    const { id: memberId } = await this.getRequiredMemberContext(true)
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

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const playlistCreationParameters = createType<VideoCreationParameters, 'VideoCreationParameters'>(
      'VideoCreationParameters',
      {
        assets,
        meta: metadataToBytes(ContentMetadata, { playlistMetadata: meta }),
        enable_comments: enableComments,
      }
    )

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), metadata: meta, enableComments }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createVideo', [
      actor,
      channelId,
      playlistCreationParameters,
    ])

    const playlistId: VideoId = this.getEvent(result, 'content', 'VideoCreated').data[2]
    this.log(chalk.green(`Playlist with id ${chalk.cyanBright(playlistId.toString())} successfully created!`))

    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        keypair,
        memberId.toNumber(),
        `dynamic:channel:${channelId.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
