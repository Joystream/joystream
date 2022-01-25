import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'

export default class CreateBountyCommand extends BountyCommandBase {
  static description = 'Veto bounty by the Council.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of the Bounty to veto',
    },
  ]

  async run() {
    const { bountyId } = this.parse(CreateBountyCommand).args

    const [councilMember, councilMemberAddress] = await this.getBountyActor('Council')
    await this.ensureBountyCanBeCanceled(bountyId, councilMember)

    this.jsonPrettyPrint(JSON.stringify({ bountyId }))

    await this.requireConfirmation('Do you confirm the the bountId?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(councilMemberAddress),
      'bounty',
      'vetoBounty',
      [bountyId]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'BountyVetoed')
      this.log(chalk.green(`Bounty with id ${chalk.cyanBright(event?.data[1].toString())} successfully vetoed!`))
    }
  }
}
