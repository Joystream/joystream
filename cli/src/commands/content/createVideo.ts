import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { videoMetadataFromInput } from '../../helpers/serialization'
import { VideoCreationParameters, VideoCreationParametersInput } from '../../Types'

export default class CreateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Create video under specific channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
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
    let { context, input } = this.parse(CreateVideoCommand).flags

    const { channelId } = this.parse(CreateVideoCommand).args

    if (!context) {
      context = await this.promptForOwnerContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      const videoCreationParametersInput = await getInputJson<VideoCreationParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = videoMetadataFromInput(api, videoCreationParametersInput)

      const videoCreationParameters: VideoCreationParameters = {
        assets: videoCreationParametersInput.assets,
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoCreationParametersInput))
      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createVideo', [
          actor,
          channelId,
          videoCreationParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
