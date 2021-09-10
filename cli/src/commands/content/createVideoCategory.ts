import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { VideoCategoryCreationParameters } from '@joystream/types/content'
import { VideoCategoryInputSchema } from '../../json-schemas/ContentDirectory'
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
  }

  async run() {
    const { context, input } = this.parse(CreateVideoCategoryCommand).flags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

    const videoCategoryInput = await getInputJson<VideoCategoryInputParameters>(input, VideoCategoryInputSchema)
    const meta = asValidatedMetadata(VideoCategoryMetadata, videoCategoryInput)

    const videoCategoryCreationParameters: CreateInterface<VideoCategoryCreationParameters> = {
      meta: metadataToBytes(VideoCategoryMetadata, meta),
    }

    this.jsonPrettyPrint(JSON.stringify(videoCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(currentAccount, 'content', 'createVideoCategory', [
      actor,
      videoCategoryCreationParameters,
    ])

    if (result) {
      const event = this.findEvent(result, 'content', 'VideoCategoryCreated')
      this.log(
        chalk.green(`VideoCategory with id ${chalk.cyanBright(event?.data[1].toString())} successfully created!`)
      )
    }
  }
}
