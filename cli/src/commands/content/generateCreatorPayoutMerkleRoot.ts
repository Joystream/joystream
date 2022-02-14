import { generateMerkleRoot } from '@joystreamjs/content'
import { CreatorPayoutPayloadSchema } from '@joystreamjs/utils'
import { CreatorPayoutPayload as CreatorPayoutPayloadJson } from '@joystreamjs/utils/typings/CreatorPayoutPayload.schema'
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import { getInputJson } from '../../helpers/InputOutput'

export default class GenerateCreatorPayoutMerkleRoot extends Command {
  static description = 'Generate merkle root for creator payout payload passed as JSON input.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file containing creator payouts`,
    }),
  }

  async run(): Promise<void> {
    const { input } = this.parse(GenerateCreatorPayoutMerkleRoot).flags
    const payloadBodyInput = await getInputJson<CreatorPayoutPayloadJson>(input, CreatorPayoutPayloadSchema)
    const merkleRoot = generateMerkleRoot(payloadBodyInput)

    this.log(chalk.green(`Creator Payout payload merkle root is ${chalk.cyanBright(merkleRoot)}!`))
  }
}
