import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { VideoUpdateParameters, VideoUpdateParametersInput } from '../../Types'
import { videoMetadataFromInput } from '../../helpers/serialization'

export default class UpdateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    input: IOFlags.input,
  }

  static args = [
    {
      name: 'videoId',
      required: true,
      description: 'ID of the Video',
    },
  ]

  async run() {
    const { input } = this.parse(UpdateVideoCommand).flags

    const { videoId } = this.parse(UpdateVideoCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()

    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const actor = await this.getChannelOwnerActor(channel)

    await this.requestAccountDecoding(currentAccount)

    if (input) {
      const videoUpdateParametersInput = await getInputJson<VideoUpdateParametersInput>(input)

      const api = await this.getOriginalApi()

      const meta = videoMetadataFromInput(api, videoUpdateParametersInput)

      const videoUpdateParameters: VideoUpdateParameters = {
        assets: videoUpdateParametersInput.assets,
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoUpdateParametersInput))
      this.log('Meta: ' + meta)

      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed) {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideo', [
          actor,
          videoId,
          videoUpdateParameters,
        ])
      }
    } else {
      this.error('Input invalid or was not provided...')
    }
  }
}
