import {Command, flags} from '@oclif/command'
import { uploadDataObjects } from '../../services/extrinsics'

export default class DevUpload extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
  }

  static args = [{name: 'file'}]

  async run(): Promise<void> {
    const { flags } = this.parse(DevUpload)

    this.log('Uploading data objects...')
    if (flags.dev) {
      this.log('development mode is ON')
    }

    await uploadDataObjects()
  }

  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }
}
