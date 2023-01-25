import { generateJsonPayloadFromPayoutsVector, generateSerializedPayload } from '@joystream/js/content'
import { ChannelPayoutsVectorSchema } from '@joystream/js/utils'
import { ChannelPayoutsVector } from '@joystream/js/typings/ChannelPayoutsVector.schema'

import { flags } from '@oclif/command'
import { blake2AsHex } from '@polkadot/util-crypto'
import chalk from 'chalk'
import UploadBaseCommand from '../../base/UploadCommandBase'
import { displayCollapsedRow } from '../../helpers/display'
import { getInputJson, saveOutputToFile } from '../../helpers/InputOutput'

export default class GenerateChannelPayoutsPayload extends UploadBaseCommand {
  static description = 'Generate serialized channel payouts payload from JSON input.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file containing channel payouts vector`,
    }),
    out: flags.string({
      char: 'o',
      required: true,
      description: `Path to output file where serialized channel payouts payload will be saved`,
    }),
    ...UploadBaseCommand.flags,
  }

  async run(): Promise<void> {
    const { input, out } = this.parse(GenerateChannelPayoutsPayload).flags
    const payloadBodyInput = await getInputJson<ChannelPayoutsVector>(input, ChannelPayoutsVectorSchema)
    const [commitment, channelPayouts] = generateJsonPayloadFromPayoutsVector(payloadBodyInput)
    const serializedPayload = generateSerializedPayload(channelPayouts)

    saveOutputToFile(out, serializedPayload)

    displayCollapsedRow({
      'Payload Size': Buffer.from(serializedPayload).byteLength,
      'Payload Hash': await this.calculateFileHash(out),
      'Payload Commitment': commitment,
    })

    this.log(chalk.green(`Channel Payout payload successfully saved to file: ${chalk.cyanBright(out)} !`))
  }
}
