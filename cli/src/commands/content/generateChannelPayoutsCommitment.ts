import { generateCommitmentFromPayloadFile } from '@joystream/js/content'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class GenerateChannelPayoutsCommitment extends ContentDirectoryCommandBase {
  static description = 'Generate merkle root (commitment) from channel payouts payload.'
  static flags = {
    path: flags.string({
      required: false,
      description: 'Path to the serialized payload file',
      exclusive: ['url'],
    }),
    url: flags.string({
      required: false,
      description: 'URL to the serialized payload file',
      exclusive: ['path'],
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { path, url } = this.parse(GenerateChannelPayoutsCommitment).flags
    if (!(path || url)) {
      this.error('One of path or url should be provided')
    }

    try {
      const commitment = path
        ? await generateCommitmentFromPayloadFile('PATH', path)
        : await generateCommitmentFromPayloadFile('URL', url!)

      this.log(chalk.green(`Channel Payout payload merkle root is ${chalk.cyanBright(commitment)}!`))
    } catch (error) {
      this.error(`Invalid serialized payload input ${error}`)
    }
  }
}
