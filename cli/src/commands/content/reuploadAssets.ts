import UploadCommandBase from '../../base/UploadCommandBase'
import { getInputJson } from '../../helpers/InputOutput'
import AssetsSchema from '../../schemas/json/Assets.schema.json'
import { Assets as AssetsInput } from '../../schemas/typings/Assets.schema'
import { flags } from '@oclif/command'
import BN from 'bn.js'

export default class ReuploadVideoAssetsCommand extends UploadCommandBase {
  static description = 'Allows reuploading assets that were not successfully uploaded during channel/video creation'

  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: 'Path to JSON file containing array of assets to reupload (contentIds and paths)',
    }),
  }

  async run(): Promise<void> {
    const { input } = this.parse(ReuploadVideoAssetsCommand).flags

    // Get context
    const [memberId, membership] = await this.getRequiredMemberContext()

    // Get input from file
    const inputData = await getInputJson<AssetsInput>(input, AssetsSchema)
    const { bagId } = inputData
    const inputAssets = inputData.assets.map(({ objectId, path }) => ({
      dataObjectId: new BN(objectId),
      path,
    }))

    // Upload assets
    await this.uploadAssets(
      await this.getDecodedPair(membership.controller_account),
      memberId.toNumber(),
      bagId,
      inputAssets,
      input,
      ''
    )
  }
}
