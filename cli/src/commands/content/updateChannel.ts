import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { channelMetadataFromInput } from '../../helpers/serialization'
import { ChannelUpdateParameters, ChannelUpdateParametersInput } from '../../Types'

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run() {
    let { context, input, output } = this.parse(UpdateChannelCommand).flags

    const { channelId } = this.parse(UpdateChannelCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let channelUpdateParametersInput = await getInputJson<ChannelUpdateParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelMetadataFromInput(api, channelUpdateParametersInput)

      let channelUpdateParameters: ChannelUpdateParameters = {
        assets: channelUpdateParametersInput.assets,
        new_meta: meta,
        reward_account: channelUpdateParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelUpdateParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && channelUpdateParameters) {
        saveOutputJson(output, `${channelUpdateParametersInput.meta.title}Channel.json`, channelUpdateParametersInput)
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannel', [
          actor,
          channelId,
          channelUpdateParameters,
        ])
      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
