import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryInputParameters } from '../../Types'
import { metadataToBytes, videoCategoryMetadataFromInput } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { VideoCategoryCreationParameters } from '@joystream/types/content'
import { VideoCategoryInputSchema } from '../../json-schemas/ContentDirectory'

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

    const meta = videoCategoryMetadataFromInput(videoCategoryInput)

    const videoCategoryCreationParameters: CreateInterface<VideoCategoryCreationParameters> = {
      meta: metadataToBytes(meta),
    }

    this.jsonPrettyPrint(JSON.stringify(videoCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'createVideoCategory', [
      actor,
      videoCategoryCreationParameters,
    ])
  }
}
