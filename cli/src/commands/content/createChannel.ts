import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { ChannelCreationParameters, ChannelCreationParametersInput } from '../../Types'
import { channelMetadataFromInput } from '../../helpers/serialization'

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  async run() {
    let { context, input, output } = this.parse(CreateChannelCommand).flags

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let channelCreationParametersInput = await getInputJson<ChannelCreationParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelMetadataFromInput(api, channelCreationParametersInput)

      let channelCreationParameters: ChannelCreationParameters = {
        assets: channelCreationParametersInput.assets,
        meta,
        reward_account: channelCreationParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelCreationParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && channelCreationParametersInput) {
        saveOutputJson(
          output,
          `${channelCreationParametersInput.meta.title}Channel.json`,
          channelCreationParametersInput
        )
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createChannel', [actor, channelCreationParameters])
      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
