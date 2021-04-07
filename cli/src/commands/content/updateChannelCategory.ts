import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { ChannelCategoryUpdateParameters, ChannelCategoryUpdateParametersInput } from '../../Types'
import { channelCategoryMetadataFromInput } from '../../helpers/serialization'

export default class UpdateChannelCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Update channel category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: IOFlags.input,
  }

  static args = [
    {
      name: 'channelCategoryId',
      required: true,
      description: 'ID of the Channel Category',
    },
  ]

  async run() {
    let { context, input } = this.parse(UpdateChannelCategoryCommand).flags

    const { channelCategoryId } = this.parse(UpdateChannelCategoryCommand).args

    if (!context) {
      context = await this.promptForCategoriesContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      const channelCategoryUpdateParametersInput = await getInputJson<ChannelCategoryUpdateParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelCategoryMetadataFromInput(api, channelCategoryUpdateParametersInput)

      const channelCategoryUpdateParameters: ChannelCategoryUpdateParameters = {
        new_meta: meta,
      }

      this.jsonPrettyPrint(JSON.stringify(channelCategoryUpdateParametersInput))

      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannelCategory', [
          actor,
          channelCategoryId,
          channelCategoryUpdateParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
