import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { CreateInterface } from '@joystream/types'
import { VideoCategoryUpdateParameters } from '@joystream/types/content'
import { VideoCategoryInputSchema } from '../../json-schemas/ContentDirectory'
import { VideoCategoryMetadata } from '@joystream/metadata-protobuf'

export default class UpdateVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Update video category inside content directory.'
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
      name: 'videoCategoryId',
      required: true,
      description: 'ID of the Video Category',
    },
  ]

  async run() {
    const { context, input } = this.parse(UpdateVideoCategoryCommand).flags

    const { videoCategoryId } = this.parse(UpdateVideoCategoryCommand).args

    const [actor, address] = context ? await this.getContentActor(context) : await this.getCategoryManagementActor()

    const videoCategoryInput = await getInputJson<VideoCategoryInputParameters>(input, VideoCategoryInputSchema)
    const meta = asValidatedMetadata(VideoCategoryMetadata, videoCategoryInput)

    const videoCategoryUpdateParameters: CreateInterface<VideoCategoryUpdateParameters> = {
      new_meta: metadataToBytes(VideoCategoryMetadata, meta),
    }

    this.jsonPrettyPrint(JSON.stringify(videoCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'updateVideoCategory', [
      actor,
      videoCategoryId,
      videoCategoryUpdateParameters,
    ])
  }
}
