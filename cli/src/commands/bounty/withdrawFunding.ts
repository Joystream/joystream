import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'

export default class WithdrawFundingCommand extends BountyCommandBase {
  static description = 'Withdraw funding from the bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of the Bounty',
    },
  ]

  static flags = {
    funderContext: BountyCommandBase.bountyActorContextFlag,
  }

  async run() {
    let { funderContext } = this.parse(WithdrawFundingCommand).flags
    const { bountyId } = this.parse(WithdrawFundingCommand).args

    // Context
    if (!funderContext) {
      funderContext = await this.promptForCreatorContext()
    }

    const [funder, funderAddress] = await this.getBountyActor(funderContext)
    const bounty = await this.getApi().bountyById(bountyId)

    const isFundingStage = await this.isFundingStage(bounty)
    const isFundingExpiredStage = await this.isFundingExpiredStage(bounty)
    const isWorkSubmissionStage = await this.isWorkSubmissionStage(bounty)
    const isJudgmentStage = await this.isJudgmentStage(bounty)
    const isSuccessfulBountyWithdrawlStage = await this.isSuccessfulBountyWithdrawalStage(bounty)

    // if bounty is in any of the following stages funds cannot be withdrawn
    if (
      isFundingStage ||
      isFundingExpiredStage ||
      isWorkSubmissionStage ||
      isJudgmentStage ||
      isSuccessfulBountyWithdrawlStage
    ) {
      this.error('Funds cannot be withdrawn in this stage', { exit: ExitCodes.AccessDenied })
    }

    this.jsonPrettyPrint(JSON.stringify({ bountyId }))

    await this.requireConfirmation('Do you confirm to withdraw funding from bounty?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(funderAddress),
      'bounty',
      'withdrawFunding',
      [funder, bountyId]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'BountyFundingWithdrawal')
      this.log(
        chalk.green(`Amount successfully refunded from bounty with id ${chalk.cyanBright(event?.data[1].toString())} !`)
      )
    }
  }
}
