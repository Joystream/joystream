import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { VideoUpdateParameters, VideoUpdateParametersInput } from '../../Types'
import { videoMetadataFromInput } from '../../helpers/serialization'

export default class UpdateVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Update video under specific id.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  static args = [
    {
      name: 'videoId',
      required: true,
      description: 'ID of the Video',
    },
  ]

  async run() {
    let { context, input, output } = this.parse(UpdateVideoCommand).flags

    const { videoId } = this.parse(UpdateVideoCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let videoUpdateParametersInput = await getInputJson<VideoUpdateParametersInput>(input)

      const api = await this.getOriginalApi()
      
      const meta = videoMetadataFromInput(api, videoUpdateParametersInput)

      let videoUpdateParameters: VideoUpdateParameters = {
        assets: videoUpdateParametersInput.assets,
        meta,
      }

      this.jsonPrettyPrint(JSON.stringify(videoUpdateParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && videoUpdateParametersInput)  {
        saveOutputJson(output, `${videoUpdateParametersInput.meta.title}Video.json`, videoUpdateParametersInput)
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideo', [actor, videoId, videoUpdateParameters])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
