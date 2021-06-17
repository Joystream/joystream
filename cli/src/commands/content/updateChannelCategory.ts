import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { ChannelCategoryInputParameters } from '../../Types'
import { channelCategoryMetadataFromInput, metadataToBytes } from '../../helpers/serialization'
import { CreateInterface } from '@joystream/types'
import { ChannelCategoryUpdateParameters } from '@joystream/types/content'
import { flags } from '@oclif/command'
import { ChannelCategoryInputSchema } from '../../json-schemas/ContentDirectory'
export default class UpdateChannelCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Update channel category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  static args = [
    {
      name: 'channelCategoryId',
      required: true,
      description: 'ID of the Channel Category',
    },
  ]

  async run() {
    const { context, input } = this.parse(UpdateChannelCategoryCommand).flags

    const { channelCategoryId } = this.parse(UpdateChannelCategoryCommand).args

    const [actor, address] = context ? await this.getContentActor(context) : await this.getCategoryManagementActor()

    const channelCategoryInput = await getInputJson<ChannelCategoryInputParameters>(input, ChannelCategoryInputSchema)

    const meta = channelCategoryMetadataFromInput(channelCategoryInput)

    const channelCategoryUpdateParameters: CreateInterface<ChannelCategoryUpdateParameters> = {
      new_meta: metadataToBytes(meta),
    }

    this.jsonPrettyPrint(JSON.stringify(channelCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'updateChannelCategory', [
      actor,
      channelCategoryId,
      channelCategoryUpdateParameters,
    ])
  }
}
