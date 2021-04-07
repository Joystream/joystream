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

  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'ID of the Video Category',
    },
  ]

  async run() {
    const { context, input } = this.parse(UpdateVideoCategoryCommand).flags

    const { videoCategoryId } = this.parse(UpdateVideoCategoryCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

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
          videoCategoryId,
          videoCategoryUpdateParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
