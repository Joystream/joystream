import { generateCommitmentFromPayloadFile } from '@joystreamjs/content'
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'

export default class GenerateChannelPayoutsCommitment extends Command {
  static description = 'Generate merkle root from channel payouts payload.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to serialized channel payouts payload file`,
    }),
  }

  async run(): Promise<void> {
    const { input } = this.parse(GenerateChannelPayoutsCommitment).flags
    try {
      const commitment = await generateCommitmentFromPayloadFile(input)
      this.log(chalk.green(`Channel Payout payload merkle root is ${chalk.cyanBright(commitment)}!`))
    } catch (error) {
      this.error(`Invalid serialized payload input ${error}`)
    }
  }
}
