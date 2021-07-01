import { getInputJson } from '../../helpers/InputOutput'
import { ChannelInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { ChannelCreationParameters } from '@joystream/types/content'
import { ChannelInputSchema } from '../../json-schemas/ContentDirectory'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import chalk from 'chalk'
import { ChannelMetadata } from '@joystream/metadata-protobuf'

export default class CreateChannelCommand extends UploadCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  async run() {
    let { context, input } = this.parse(CreateChannelCommand).flags

    // Context
    if (!context) {
      context = await this.promptForOwnerContext()
    }
    const [actor, address] = await this.getContentActor(context)

    const channelInput = await getInputJson<ChannelInputParameters>(input, ChannelInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)

    const { coverPhotoPath, avatarPhotoPath } = channelInput
    const assetsPaths = [coverPhotoPath, avatarPhotoPath].filter((v) => v !== undefined) as string[]
    const inputAssets = await this.prepareInputAssets(assetsPaths, input)
    const assets = inputAssets.map(({ parameters }) => ({ Upload: parameters }))
    // Set assets indexes in the metadata
    const [coverPhotoIndex, avatarPhotoIndex] = this.assetsIndexes([coverPhotoPath, avatarPhotoPath], assetsPaths)
    meta.coverPhoto = coverPhotoIndex
    meta.avatarPhoto = avatarPhotoIndex

    const channelCreationParameters: CreateInterface<ChannelCreationParameters> = {
      assets,
      meta: metadataToBytes(ChannelMetadata, meta),
      reward_account: channelInput.rewardAccount,
    }

    this.jsonPrettyPrint(JSON.stringify({ assets, metadata: meta }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'createChannel', [
      actor,
      channelCreationParameters,
    ])
    if (result) {
      const event = this.findEvent(result, 'content', 'ChannelCreated')
      this.log(chalk.green(`Channel with id ${chalk.cyanBright(event?.data[1].toString())} successfully created!`))
    }

    await this.uploadAssets(inputAssets, input)
  }
}
