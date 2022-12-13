import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class UpdateChannelStateBloatBondCommand extends ContentDirectoryCommandBase {
  static description = 'Update channel state bloat bond.'
  static args = [
    {
      name: 'value',
      required: true,
      description: 'New state bloat bond value',
    },
  ]

  async run(): Promise<void> {
    const { value } = this.parse(UpdateChannelStateBloatBondCommand).args

    // Context
    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount)

    this.jsonPrettyPrint(JSON.stringify({ newChannelStateBloatBond: value }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateChannelStateBloatBond', [value])

    const channelStateBloatBondValueUpdatedEvent = this.getEvent(result, 'content', 'ChannelStateBloatBondValueUpdated')
    const channelStateBloatBondValue = channelStateBloatBondValueUpdatedEvent.data[0]

    this.log(
      chalk.green(`Updated channel state bloat bond is ${chalk.cyanBright(channelStateBloatBondValue.toString())}!`)
    )
    this.output(value.toString())
  }
}
