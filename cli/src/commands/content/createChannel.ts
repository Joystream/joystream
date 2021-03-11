import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import {ChannelCreationParametersMetadata, AssetsMetadata} from '@joystream/content-metadata-protobuf'

type ChannelCreationParametersInput = {
  assets?: AssetsMetadata.AsObject,
  meta?: Uint8Array,
  rewardAccount?: Uint8Array | string,
}

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  async run() {
    let { context, input } = this.parse(CreateChannelCommand).flags

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let channelCreationParameters = await getInputJson<ChannelCreationParametersMetadata>(input)

      let channelCreationParametersInput: ChannelCreationParametersInput = {
        assets: channelCreationParameters.getAssets()?.toObject(),
        meta: channelCreationParameters.getMeta()?.serializeBinary(),
        rewardAccount: channelCreationParameters.getRewardAccount()
      }

      this.jsonPrettyPrint(JSON.stringify(channelCreationParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed)  {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'contentDirectory', 'createChannel', [actor, channelCreationParametersInput])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
