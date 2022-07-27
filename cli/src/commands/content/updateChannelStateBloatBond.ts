import { flags } from '@oclif/command'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class UpdateChannelStateBloatBondCommand extends ContentDirectoryCommandBase {
  static description = 'update channel state bloat bond.'
  static flags = {
    context: ContentDirectoryCommandBase.channelCreationContextFlag,
    input: flags.integer({
      char: 'i',
      required: true,
      description: `New state bloat bond value`,
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { input } = this.parse(UpdateChannelStateBloatBondCommand).flags

    // Context
    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount)

    this.jsonPrettyPrint(JSON.stringify({ newChannelStateBloatBond: input }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateChannelStateBloatBond', [input])

    const channelStateBloatBondValueUpdatedEvent = this.getEvent(result, 'content', 'ChannelStateBloatBondValueUpdated')
    const value = channelStateBloatBondValueUpdatedEvent.data[0]

    this.log(chalk.green(`Updated channel state bloat bond is ${chalk.cyanBright(value.toString())}!`))
    this.output(value.toString())
  }
}
