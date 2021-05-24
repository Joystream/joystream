import { flags } from '@oclif/command'
import { uploadDataObjects } from '../../services/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class DevUpload extends ApiCommandBase {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    await this.ensureDevelopmentChain()

    this.log('Uploading data objects...')

    await uploadDataObjects()
  }
}
