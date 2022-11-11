import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class UpdateVideoStateBloatBondCommand extends ContentDirectoryCommandBase {
  static description = 'Update video state bloat bond.'
  static args = [
    {
      name: 'value',
      required: true,
      description: 'New state bloat bond value',
    },
  ]

  async run(): Promise<void> {
    const { value } = this.parse(UpdateVideoStateBloatBondCommand).args

    // Context
    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount)

    this.jsonPrettyPrint(JSON.stringify({ newVideoStateBloatBond: value }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateVideoStateBloatBond', [value])

    const videoStateBloatBondValueUpdatedEvent = this.getEvent(result, 'content', 'VideoStateBloatBondValueUpdated')
    const videoStateBloatBondValue = videoStateBloatBondValueUpdatedEvent.data[0]

    this.log(chalk.green(`Updated video state bloat bond is ${chalk.cyanBright(videoStateBloatBondValue.toString())}!`))
    this.output(value.toString())
  }
}
