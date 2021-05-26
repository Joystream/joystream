import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { ChannelCategoryInputParameters } from '../../Types'
import { channelCategoryMetadataFromInput, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { ChannelCategoryCreationParameters } from '@joystream/types/content'
import { ChannelCategoryInputSchema } from '../../json-schemas/ContentDirectory'
import chalk from 'chalk'

export default class CreateChannelCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  async run() {
    const { context, input } = this.parse(CreateChannelCategoryCommand).flags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

    const channelCategoryInput = await getInputJson<ChannelCategoryInputParameters>(input, ChannelCategoryInputSchema)

    const meta = channelCategoryMetadataFromInput(channelCategoryInput)

    const channelCategoryCreationParameters: CreateInterface<ChannelCategoryCreationParameters> = {
      meta: metadataToBytes(meta),
    }

    this.jsonPrettyPrint(JSON.stringify(channelCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(currentAccount, 'content', 'createChannelCategory', [
      actor,
      channelCategoryCreationParameters,
    ])

    if (result) {
      const event = this.findEvent(result, 'content', 'ChannelCategoryCreated')
      this.log(chalk.green(`ChannelCategory with id ${chalk.cyanBright(event?.data[0].toString())} successfully created!`))
    }
  }
}
