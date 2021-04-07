import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryCreationParameters, VideoCategoryCreationParametersInput } from '../../Types'
import { videoCategoryMetadataFromInput } from '../../helpers/serialization'

export default class CreateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create video category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: IOFlags.input, // TODO: Fix that
  }

  async run() {
    const { context, input } = this.parse(CreateVideoCategoryCommand).flags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

    if (input) {
      const videoCategoryCreationParametersInput = await getInputJson<VideoCategoryCreationParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = videoCategoryMetadataFromInput(api, videoCategoryCreationParametersInput)

      const videoCategoryCreationParameters: VideoCategoryCreationParameters = {
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoCategoryCreationParametersInput))

      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createVideoCategory', [
          actor,
          videoCategoryCreationParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
