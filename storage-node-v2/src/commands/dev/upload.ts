import { flags } from '@oclif/command'
import { uploadDataObjects } from '../../services/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class DevUpload extends ApiCommandBase {
  static description = 'Upload data object (development mode only).'

  static flags = {
    help: flags.help({ char: 'h' }),
    size: flags.integer({
      char: 's',
      required: true,
      description: 'Data object size.',
    }),   
    cid: flags.string({
      char: 'c',
      required: true,
      description: 'Data object IPFS content ID.',
    })
  }

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    const { flags } = this.parse(DevUpload)

    await this.ensureDevelopmentChain()

    const objectSize = flags.size ?? 0
    const objectCid = flags.cid

    this.log('Uploading data objects...')

    await uploadDataObjects(objectSize, objectCid)
  }
}
