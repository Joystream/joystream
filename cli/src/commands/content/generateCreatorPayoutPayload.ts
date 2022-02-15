import { generateSerializedPayload } from '@joystreamjs/content'
import { CreatorPayoutPayloadSchema } from '@joystreamjs/utils'
import { CreatorPayoutPayload as CreatorPayoutPayloadInput } from '@joystreamjs/utils/typings/CreatorPayoutPayload.schema'
import { Command, flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import chalk from 'chalk'
import { displayCollapsedRow } from '../../helpers/display'
import { getInputJson, saveOutputToFile } from '../../helpers/InputOutput'

export default class GenerateCreatorPayoutPayload extends Command {
  static description = 'Create serialized creator payouts payload from JSON input.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file containing creator payouts`,
    }),
    out: flags.string({
      char: 'o',
      required: true,
      description: `Path to file where serialized creator payouts payload will be stored`,
    }),
  }

  async run(): Promise<void> {
    const { input, out } = this.parse(GenerateCreatorPayoutPayload).flags
    const payloadBodyInput = await getInputJson<CreatorPayoutPayloadInput>(input, CreatorPayoutPayloadSchema)
    const serializedPayload = generateSerializedPayload(payloadBodyInput)

    displayCollapsedRow({
      'Payload Size': Buffer.from(serializedPayload).byteLength,
      'Payload Hash': blake2AsHex(serializedPayload),
    })

    saveOutputToFile(out, serializedPayload)

    this.log(chalk.green(`Creator Payout payload successfully saved to file: ${chalk.cyanBright(out)} !`))
  }
}
