import { generateMerkleRoot } from '@joystreamjs/content'
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'

export default class GenerateCreatorPayoutMerkleRoot extends Command {
  static description = 'Generate merkle root from creator payouts payload.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to serialized creator payouts payload file`,
    }),
  }

  async run(): Promise<void> {
    const { input } = this.parse(GenerateCreatorPayoutMerkleRoot).flags
    try {
      const merkleRoot = await generateMerkleRoot(input)
      this.log(chalk.green(`Creator Payout payload merkle root is ${chalk.cyanBright(merkleRoot)}!`))
    } catch (error) {
      this.error(`Invalid serialized payload input ${error}`)
    }
  }
}
