import { generateSerializedPayload } from '@joystreamjs/content'
import { ChannelPayoutPayloadSchema } from '@joystreamjs/utils'
import { ChannelPayout } from '@joystreamjs/utils/typings/ChannelPayoutsPayload.schema'
import { Command, flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import chalk from 'chalk'
import { displayCollapsedRow } from '../../helpers/display'
import { getInputJson, saveOutputToFile } from '../../helpers/InputOutput'

export default class GenerateChannelPayoutPayload extends Command {
  static description = 'Create serialized channel payouts payload from JSON input.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file containing channel payouts`,
    }),
    out: flags.string({
      char: 'o',
      required: true,
      description: `Path to file where serialized channel payouts payload will be stored`,
    }),
  }

  async run(): Promise<void> {
    const { input, out } = this.parse(GenerateChannelPayoutPayload).flags
    const payloadBodyInput = await getInputJson<ChannelPayout[]>(input, ChannelPayoutPayloadSchema)
    const serializedPayload = generateSerializedPayload(payloadBodyInput)

    displayCollapsedRow({
      'Payload Size': Buffer.from(serializedPayload).byteLength,
      'Payload Hash': blake2AsHex(serializedPayload),
    })

    saveOutputToFile(out, serializedPayload)

    this.log(chalk.green(`Channel Payout payload successfully saved to file: ${chalk.cyanBright(out)} !`))
  }
}
