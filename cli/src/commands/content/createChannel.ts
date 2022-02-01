import { getInputJson } from '../../helpers/InputOutput'
import { ChannelCreationInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import { ChannelCreationParameters } from '@joystream/types/content'
import { ChannelCreationInputSchema } from '../../schemas/ContentDirectory'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import chalk from 'chalk'
import { ChannelMetadata } from '@joystream/metadata-protobuf'

export default class CreateChannelCommand extends UploadCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.channelCreationContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  async run(): Promise<void> {
    let { context, input } = this.parse(CreateChannelCommand).flags

    // Context
    if (!context) {
      context = await this.promptForChannelCreationContext()
    }
    const [actor, address] = await this.getContentActor(context)
    const { id: memberId } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    const channelInput = await getInputJson<ChannelCreationInputParameters>(input, ChannelCreationInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)
    const { collaborators, moderators, rewardAccount } = channelInput

    if (collaborators) {
      await this.validateMemberIdsSet(collaborators, 'collaborator')
    }

    if (moderators) {
      await this.validateMemberIdsSet(moderators, 'moderator')
    }

    const { coverPhotoPath, avatarPhotoPath } = channelInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets(
      { coverPhotoPath, avatarPhotoPath },
      input
    )
    meta.coverPhoto = assetIndices.coverPhotoPath
    meta.avatarPhoto = assetIndices.avatarPhotoPath

    // Preare and send the extrinsic
    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const channelCreationParameters = createType<ChannelCreationParameters, 'ChannelCreationParameters'>(
      'ChannelCreationParameters',
      {
        assets,
        meta: metadataToBytes(ChannelMetadata, meta),
        collaborators,
        moderators,
        reward_account: rewardAccount,
      }
    )

    this.jsonPrettyPrint(
      JSON.stringify({ assets: assets?.toJSON(), metadata: meta, collaborators, moderators, rewardAccount })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createChannel', [
      actor,
      channelCreationParameters,
    ])

    const channelCreatedEvent = this.findEvent(result, 'content', 'ChannelCreated')
    const channelId = channelCreatedEvent!.data[1]
    this.log(chalk.green(`Channel with id ${chalk.cyanBright(channelId.toString())} successfully created!`))

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
