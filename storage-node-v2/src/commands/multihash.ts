import {Command, flags} from '@oclif/command'
import { hashFile } from '../services/hashing'

export default class Multihash extends Command {
  static description = 'Creates a multihash (blake3) for a file.'

  static flags = {
    help: flags.help({char: 'h'}),
    file: flags.string(
      {
        char: 'f',
        required: true,
        description: 'Path for a hashing file.'
      }
      ),
  }

  async run() {
    const { flags } = this.parse(Multihash)

    console.log(`Hashing ${flags.file}`)

    const multi = await hashFile(flags.file)

    console.log(multi)
  }
}
