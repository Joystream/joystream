import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { channelMetadataFromInput } from '../../helpers/serialization'
import { ChannelUpdateParameters, ChannelUpdateParametersInput } from '../../Types'

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
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
    const { input } = this.parse(UpdateChannelCommand).flags

    const { channelId } = this.parse(UpdateChannelCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()

    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)

    await this.requestAccountDecoding(currentAccount)

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
