import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { ChannelCategoryCreationParameters, ChannelCategoryCreationParametersInput } from '../../Types'
import { channelCategoryMetadataFromInput } from '../../helpers/serialization'

export default class CreateChannelCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: IOFlags.input,
  }

  async run() {
    const { context, input } = this.parse(CreateChannelCategoryCommand).flags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

    if (input) {
      const channelCategoryCreationParametersInput = await getInputJson<ChannelCategoryCreationParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = channelCategoryMetadataFromInput(api, channelCategoryCreationParametersInput)

      const channelCategoryCreationParameters: ChannelCategoryCreationParameters = {
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(channelCategoryCreationParametersInput))

      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createChannelCategory', [
          actor,
          channelCategoryCreationParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
