import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryUpdateParameters, VideoCategoryUpdateParametersInput } from '../../Types'
import { videoCategoryMetadataFromInput } from '../../helpers/serialization'

export default class UpdateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Update video category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: IOFlags.input,
  }

  async run() {
    let { context, input } = this.parse(UpdateVideoCategoryCommand).flags

    if (!context) {
      context = await this.promptForCategoriesContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      const videoCategoryUpdateParametersInput = await getInputJson<VideoCategoryUpdateParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = videoCategoryMetadataFromInput(api, videoCategoryUpdateParametersInput)

      const videoCategoryUpdateParameters: VideoCategoryUpdateParameters = {
        new_meta: meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoCategoryUpdateParameters))

      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideoCategory', [
          actor,
          videoCategoryUpdateParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
