import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { videoMetadataFromInput } from '../../helpers/serialization'
import { VideoCreationParameters, VideoCreationParametersInput } from '../../Types'

export default class CreateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Create video under specific channel inside content directory.'
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
    const { input } = this.parse(CreateVideoCommand).flags

    const { channelId } = this.parse(CreateVideoCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()

    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)

    await this.requestAccountDecoding(currentAccount)

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
