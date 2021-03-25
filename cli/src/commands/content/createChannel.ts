import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { ChannelCreationParameters, ChannelCreationParametersInput } from '../../Types'
import { channelMetadataFromInput } from '../../helpers/serialization'

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
    input: IOFlags.input,
  }

  async run() {
    let { context, input } = this.parse(CreateChannelCommand).flags

    if (!context) {
      context = await this.promptForOwnerContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      const channelCreationParametersInput = await getInputJson<ChannelCreationParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelMetadataFromInput(api, channelCreationParametersInput)

      const channelCreationParameters: ChannelCreationParameters = {
        assets: channelCreationParametersInput.assets,
        meta,
        reward_account: channelCreationParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelCreationParametersInput))

      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createChannel', [actor, channelCreationParameters])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
