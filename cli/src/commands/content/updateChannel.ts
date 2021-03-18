import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { NewAsset} from '@joystream/types/content'
import {ChannelMetadata} from '@joystream/content-metadata-protobuf'
import { Vec, Option} from '@polkadot/types';
import AccountId from '@polkadot/types/generic/AccountId';
import { Bytes } from '@polkadot/types/primitive';

type ChannelUpdateParametersInput = {
  assets: Option<Vec<NewAsset>>,
  new_meta: ChannelMetadata.AsObject,
  reward_account: Option<AccountId>,
}

type ChannelUpdateParameters = {
  assets: Option<Vec<NewAsset>>,
  new_meta: Bytes,
  reward_account: Option<AccountId>,
}

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run() {

    let { context, input, output } = this.parse(UpdateChannelCommand).flags

    const { channelId } = this.parse(UpdateChannelCommand).args

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (input) {
      let channelUpdateParametersInput = await getInputJson<ChannelUpdateParametersInput>(input)
      let channelMetadata = new ChannelMetadata()
      channelMetadata.setTitle(channelUpdateParametersInput.new_meta.title!)
      channelMetadata.setDescription(channelUpdateParametersInput.new_meta.description!)
      channelMetadata.setIsPublic(channelUpdateParametersInput.new_meta.isPublic!)
      channelMetadata.setLanguage(channelUpdateParametersInput.new_meta.language!)
      channelMetadata.setCoverPhoto(channelUpdateParametersInput.new_meta.coverPhoto!)
      channelMetadata.setAvatarPhoto(channelUpdateParametersInput.new_meta.avatarPhoto!)
      channelMetadata.setCategory(channelUpdateParametersInput.new_meta.category!)

      const serialized = channelMetadata.serializeBinary();

      const api = await this.getOriginalApi()

      const metaRaw = api.createType('Raw', serialized)
      const meta = new Bytes(api.registry, metaRaw)

      let channelUpdateParameters: ChannelUpdateParameters = {
        assets: channelUpdateParametersInput.assets,
        new_meta: meta,
        reward_account: channelUpdateParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelUpdateParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed && channelUpdateParameters)  {
        saveOutputJson(output, `${channelUpdateParametersInput.new_meta.title}Channel.json`, channelUpdateParametersInput)
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannel', [actor, channelId, channelUpdateParameters])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
