import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'

export default class CreateBountyCommand extends BountyCommandBase {
  static description = 'Cancel a bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of the Bounty to cancel',
    },
  ]

  static flags = {
    context: BountyCommandBase.bountyActorContextFlag,
  }

  async run() {
    let { context } = this.parse(CreateBountyCommand).flags
    const { bountyId } = this.parse(CreateBountyCommand).args

    // Context
    if (!context) {
      context = await this.promptForCreatorContext()
    }

    const [creator, creatorAddress] = await this.getBountyActor(context)
    await this.ensureBountyCanBeCanceled(bountyId, creator)

    this.jsonPrettyPrint(JSON.stringify({ bountyId }))

    await this.requireConfirmation('Do you confirm the the bountId?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(creatorAddress),
      'bounty',
      'cancelBounty',
      [creator, bountyId]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'BountyCanceled')
      this.log(chalk.green(`Bounty with id ${chalk.cyanBright(event?.data[1].toString())} successfully canceled!`))
    }
  }
}
