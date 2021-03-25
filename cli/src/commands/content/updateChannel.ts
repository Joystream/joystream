import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { channelMetadataFromInput } from '../../helpers/serialization'
import { ChannelUpdateParameters, ChannelUpdateParametersInput } from '../../Types'

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    input: IOFlags.input,
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run() {
    let { context, input } = this.parse(UpdateChannelCommand).flags

    const { channelId } = this.parse(UpdateChannelCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      const channelUpdateParametersInput = await getInputJson<ChannelUpdateParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelMetadataFromInput(api, channelUpdateParametersInput)

      const channelUpdateParameters: ChannelUpdateParameters = {
        assets: channelUpdateParametersInput.assets,
        new_meta: meta,
        reward_account: channelUpdateParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelUpdateParametersInput))

      this.log('Meta: ' + meta)

      this.jsonPrettyPrint(JSON.stringify(channelUpdateParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannel', [
          actor,
          channelId,
          channelUpdateParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
