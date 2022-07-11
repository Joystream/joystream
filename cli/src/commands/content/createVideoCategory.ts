// TODO: re-work afer merging metaprotocol content categories PR - https://github.com/Joystream/joystream/pull/3950

import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { VideoCategoryInputSchema } from '../../schemas/ContentDirectory'
import chalk from 'chalk'
import { VideoCategoryMetadata } from '@joystream/metadata-protobuf'

export default class CreateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Create video category inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { context, input } = this.parse(CreateVideoCategoryCommand).flags

    const [, address] = context ? await this.getContentActor(context) : await this.getCategoryManagementActor()

    const videoCategoryInput = await getInputJson<VideoCategoryInputParameters>(input, VideoCategoryInputSchema)
    const meta = asValidatedMetadata(VideoCategoryMetadata, videoCategoryInput)

    const videoCategoryCreationParameters = metadataToBytes(VideoCategoryMetadata, meta)

    this.jsonPrettyPrint(JSON.stringify(videoCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(address),
      'contentWorkingGroup',
      'leadRemark',
      [videoCategoryCreationParameters]
    )

    if (result) {
      const categoryId = this.getEvent(result, 'contentWorkingGroup', 'LeadRemarked').data[1]
      this.log(chalk.green(`VideoCategory with id ${chalk.cyanBright(categoryId.toString())} successfully created!`))
    }
  }
}
