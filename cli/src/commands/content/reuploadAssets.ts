import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import AssetsSchema from '../../json-schemas/Assets.schema.json'
import { Assets as AssetsInput } from '../../json-schemas/typings/Assets.schema'
import { flags } from '@oclif/command'
import { ContentId } from '@joystream/types/storage'

export default class ReuploadVideoAssetsCommand extends UploadCommandBase {
  static description = 'Allows reuploading assets that were not successfully uploaded during channel/video creation'

  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: 'Path to JSON file containing array of assets to reupload (contentIds and paths)',
    }),
  }

  async run() {
    const { input } = this.parse(ReuploadVideoAssetsCommand).flags

    // Get context
    const account = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(account)

    // Get input from file
    const inputData = await getInputJson<AssetsInput>(input, AssetsSchema)
    const inputAssets = inputData.map(({ contentId, path }) => ({
      contentId: ContentId.decode(this.getTypesRegistry(), contentId),
      path,
    }))

    // Upload assets
    await this.uploadAssets(inputAssets, input, '')
  }
}
