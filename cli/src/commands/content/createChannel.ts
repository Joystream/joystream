import { ChannelMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { ChannelId } from '@joystream/types/primitives'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { ChannelCreationInputSchema } from '../../schemas/ContentDirectory'
import { ChannelCreationInputParameters } from '../../Types'

export default class CreateChannelCommand extends UploadCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.channelCreationContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    ...UploadCommandBase.flags,
  }

  async run(): Promise<void> {
    let { context, input } = this.parse(CreateChannelCommand).flags

    // Context
    if (!context) {
      context = await this.promptForChannelCreationContext()
    }
    const [channelOwner, address] = await this.getChannelOwner(context)
    const keypair = await this.getDecodedPair(address)

    const channelInput = await getInputJson<ChannelCreationInputParameters>(input, ChannelCreationInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)
    const { collaborators } = channelInput

    if (collaborators) {
      await this.validateMemberIdsSet(
        collaborators.map(({ memberId }) => memberId),
        'collaborator'
      )
    }

    const { coverPhotoPath, avatarPhotoPath } = channelInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets(
      { coverPhotoPath, avatarPhotoPath },
      input
    )
    meta.coverPhoto = assetIndices.coverPhotoPath
    meta.avatarPhoto = assetIndices.avatarPhotoPath

    const expectedChannelStateBloatBond = await this.getApi().channelStateBloatBond()
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const storageBuckets = await this.getApi().selectStorageBucketsForNewChannel()
    const distributionBuckets = await this.getApi().selectDistributionBucketsForNewChannel()

    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets, 'createChannel')
    const channelCreationParameters = createType('PalletContentChannelCreationParametersRecord', {
      assets,
      expectedChannelStateBloatBond,
      expectedDataObjectStateBloatBond,
      storageBuckets,
      distributionBuckets,
      meta: metadataToBytes(ChannelMetadata, meta),
      collaborators: new Map(
        collaborators?.map(({ memberId, channelAgentPermissions }) => [memberId, channelAgentPermissions])
      ),
    })

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), metadata: meta, collaborators }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createChannel', [
      channelOwner,
      channelCreationParameters,
    ])

    const channelCreatedEvent = this.getEvent(result, 'content', 'ChannelCreated')
    const channelId: ChannelId = channelCreatedEvent.data[0]
    const { dataObjects } = channelCreatedEvent.data[1]

    this.log(chalk.green(`Channel with id ${chalk.cyanBright(channelId.toString())} successfully created!`))
    this.output(channelId.toString())

    if (dataObjects.size) {
      await this.uploadAssets(
        `dynamic:channel:${channelId.toString()}`,
        [...dataObjects].map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
