import {run as apiRun} from '../../../helpers/api'
import {Command, flags} from '@oclif/command'

export default class WgLeaderCreateBucket extends Command {
  static description = 'Create storage bucket.'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(WgLeaderCreateBucket)

    const name = flags.name ?? 'world'
    this.log(`Create storage bucket: ${name} `)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }

    await apiRun()
  }
}
