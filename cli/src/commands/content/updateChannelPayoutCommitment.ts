import { createType } from '@joystream/types'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class UpdateChannelPayoutCommitment extends ContentDirectoryCommandBase {
  static description = 'Update channel payouts payload commitment hash in the runtime storage.'
  static args = [
    {
      name: 'commitment',
      required: true,
      description: 'commitment hash/Merkle root of the channel payouts payload',
    },
  ]

  async run(): Promise<void> {
    const { commitment } = this.parse(UpdateChannelPayoutCommitment).args

    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount.toString())

    this.jsonPrettyPrint(JSON.stringify({ commitment }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateChannelPayouts', [
      createType('PalletContentUpdateChannelPayoutsParametersRecord', commitment),
    ])

    const commitmentUpdatedEvent = this.findEvent(result, 'content', 'ChannelPayoutsUpdated')
    const updatedCommitment = commitmentUpdatedEvent!.data[0]
    this.log(chalk.green(`New commitment ${chalk.cyanBright(updatedCommitment.toString())} successfully set!`))
  }
}
