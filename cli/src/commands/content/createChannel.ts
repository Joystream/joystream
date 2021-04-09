import { getInputJson } from '../../helpers/InputOutput'
import { ChannelInputParameters } from '../../Types'
import { metadataToBytes, channelMetadataFromInput } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { ChannelCreationParameters } from '@joystream/types/content'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import ExitCodes from '../../ExitCodes'

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

    const channelInput = await getInputJson<ChannelInputParameters>(input)

    const meta = channelMetadataFromInput(channelInput)
    const { coverPhotoPath, avatarPhotoPath } = channelInput
    if (!coverPhotoPath || !avatarPhotoPath) {
      // TODO: Handle with json schema validation?
      this.error('Invalid input! coverPhotoPath and avatarPhotoPath are required!', { exit: ExitCodes.InvalidInput })
    }
    const inputAssets = await this.prepareInputAssets([coverPhotoPath, avatarPhotoPath], input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    meta.setCoverPhoto(0)
    meta.setAvatarPhoto(1)

    const channelCreationParameters: CreateInterface<ChannelCreationParameters> = {
      assets,
      meta: metadataToBytes(meta),
      reward_account: channelInput.rewardAccount,
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, metadata: meta.toObject() }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(account, 'content', 'createChannel', [actor, channelCreationParameters])

    await this.uploadAssets(inputAssets, input)
  }
}
