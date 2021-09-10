import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { ChannelInputParameters } from '../../Types'
import { flags } from '@oclif/command'
import UploadCommandBase from '../../base/UploadCommandBase'
import { CreateInterface } from '@joystream/types'
import { ChannelUpdateParameters } from '@joystream/types/content'
import { ChannelInputSchema } from '../../json-schemas/ContentDirectory'
import { ChannelMetadata } from '@joystream/metadata-protobuf'

export default class UpdateChannelCommand extends UploadCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  parseRewardAccountInput(rewardAccount?: string | null): string | null | Uint8Array {
    if (rewardAccount === undefined) {
      // Reward account remains unchanged
      return null
    } else if (rewardAccount === null) {
      // Reward account changed to empty
      return new Uint8Array([1, 0])
    } else {
      // Reward account set to new account
      return rewardAccount
    }
  }

  async run() {
    const {
      flags: { input },
      args: { channelId },
    } = this.parse(UpdateChannelCommand)

    // Context
    const currentAccount = await this.getRequiredSelectedAccount()
    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(currentAccount)

    const channelInput = await getInputJson<ChannelInputParameters>(input, ChannelInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)

    const { coverPhotoPath, avatarPhotoPath, rewardAccount } = channelInput
    const inputPaths = [coverPhotoPath, avatarPhotoPath].filter((p) => p !== undefined) as string[]
    const inputAssets = await this.prepareInputAssets(inputPaths, input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    const [coverPhotoIndex, avatarPhotoIndex] = this.assetsIndexes([coverPhotoPath, avatarPhotoPath], inputPaths)
    if (coverPhotoIndex !== undefined) {
      meta.coverPhoto = coverPhotoIndex
    }
    if (avatarPhotoIndex !== undefined) {
      meta.avatarPhoto = avatarPhotoIndex
    }

    const channelUpdateParameters: CreateInterface<ChannelUpdateParameters> = {
      assets,
      new_meta: metadataToBytes(ChannelMetadata, meta),
      reward_account: this.parseRewardAccountInput(rewardAccount),
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, metadata: meta, rewardAccount }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannel', [
      actor,
      channelId,
      channelUpdateParameters,
    ])

    await this.uploadAssets(inputAssets, input)
  }
}
