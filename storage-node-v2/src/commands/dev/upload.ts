import { flags } from '@oclif/command'
import { uploadDataObjects } from '../../services/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class DevUpload extends ApiCommandBase {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
  }

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    const { flags } = this.parse(DevUpload)

    this.log('Uploading data objects...')
    if (flags.dev) {
      this.log('development mode is ON')
    }

    await uploadDataObjects()
  }
}
