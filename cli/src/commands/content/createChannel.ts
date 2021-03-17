import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { NewAsset} from '@joystream/types/content'
import {ChannelMetadata} from '@joystream/content-metadata-protobuf'
import { Vec, Option} from '@polkadot/types';
import AccountId from '@polkadot/types/generic/AccountId';
import { Bytes } from '@polkadot/types/primitive';

type ChannelCreationParametersInput = {
  assets: Vec<NewAsset>,
  meta: ChannelMetadata.AsObject,
  reward_account: Option<AccountId>,
}

type ChannelCreationParameters = {
  assets: Vec<NewAsset>,
  meta: Bytes,
  reward_account: Option<AccountId>,
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
      let channelCreationParametersInput = await getInputJson<ChannelCreationParametersInput>(input)
      let channelMetadata = new ChannelMetadata()
      channelMetadata.setTitle(channelCreationParametersInput.meta.title!)
      channelMetadata.setDescription(channelCreationParametersInput.meta.description!)
      channelMetadata.setIsPublic(channelCreationParametersInput.meta.isPublic!)
      channelMetadata.setLanguage(channelCreationParametersInput.meta.language!)
      channelMetadata.setCoverPhoto(channelCreationParametersInput.meta.coverPhoto!)
      channelMetadata.setAvatarPhoto(channelCreationParametersInput.meta.avatarPhoto!)
      channelMetadata.setCategory(channelCreationParametersInput.meta.category!)

      let channelCreationParameters: ChannelCreationParameters = {
        assets: channelCreationParametersInput.assets,
        meta: channelMetadata.serializeBinary() as Bytes,
        reward_account: channelCreationParametersInput.reward_account,
      }

      this.jsonPrettyPrint(JSON.stringify(channelCreationParameters))
      const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

      if (confirmed)  {
        this.log('Sending the extrinsic...')

        await this.sendAndFollowNamedTx(currentAccount, 'content', 'createChannel', [actor, channelCreationParametersInput])

      }
    } else {
      this.log('Input invalid or was not provided...')
    }
  }
}
