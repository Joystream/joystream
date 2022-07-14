// TODO: re-work afer merging metaprotocol content categories PR - https://github.com/Joystream/joystream/pull/3950
/*
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import { VideoCategoryInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { VideoCategoryInputSchema } from '../../schemas/ContentDirectory'
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
    ...ContentDirectoryCommandBase.flags,
  }

  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'ID of the Video Category',
    },
  ]

  async run(): Promise<void> {
    const { context, input } = this.parse(UpdateVideoCategoryCommand).flags

    // const { videoCategoryId } = this.parse(UpdateVideoCategoryCommand).args

    const [, address] = context ? await this.getContentActor(context) : await this.getCategoryManagementActor()

    const videoCategoryInput = await getInputJson<VideoCategoryInputParameters>(input, VideoCategoryInputSchema)
    const meta = asValidatedMetadata(VideoCategoryMetadata, videoCategoryInput)

    const videoCategoryUpdateParameters = metadataToBytes(VideoCategoryMetadata, meta)

    this.jsonPrettyPrint(JSON.stringify(videoCategoryInput))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'contentWorkingGroup', 'leadRemark', [
      videoCategoryUpdateParameters,
    ])
  }
}
*/