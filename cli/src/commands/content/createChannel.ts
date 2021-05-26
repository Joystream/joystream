import { getInputJson } from '../../helpers/InputOutput'
import { ChannelInputParameters } from '../../Types'
import { metadataToBytes, channelMetadataFromInput } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { ChannelCreationParameters } from '@joystream/types/content'
import { ChannelInputSchema } from '../../json-schemas/ContentDirectory'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import chalk from 'chalk'

export default class CreateChannelCommand extends UploadCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  async run() {
    let { context, input } = this.parse(CreateChannelCommand).flags

    // Context
    if (!context) {
      context = await this.promptForOwnerContext()
    }
    const account = await this.getRequiredSelectedAccount()
    const actor = await this.getActor(context)
    await this.requestAccountDecoding(account)

    const channelInput = await getInputJson<ChannelInputParameters>(input, ChannelInputSchema)

    const meta = channelMetadataFromInput(channelInput)
    const { coverPhotoPath, avatarPhotoPath } = channelInput
    const assetsPaths = [coverPhotoPath, avatarPhotoPath].filter((v) => v !== undefined) as string[]
    const inputAssets = await this.prepareInputAssets(assetsPaths, input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    if (coverPhotoPath) {
      meta.setCoverPhoto(0)
    }
    if (avatarPhotoPath) {
      meta.setAvatarPhoto(coverPhotoPath ? 1 : 0)
    }

    const channelCreationParameters: CreateInterface<ChannelCreationParameters> = {
      assets,
      meta: metadataToBytes(meta),
      reward_account: channelInput.rewardAccount,
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, metadata: meta.toObject() }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(account, 'content', 'createChannel', [
      actor,
      channelCreationParameters,
    ])
    if (result) {
      const event = this.findEvent(result, 'content', 'ChannelCreated')
      this.log(chalk.green(`Channel with id ${chalk.cyanBright(event?.data[1].toString())} successfully created!`))
    }

    await this.uploadAssets(inputAssets, input)
  }
}
