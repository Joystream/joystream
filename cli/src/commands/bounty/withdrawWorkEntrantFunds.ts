import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'

export default class WithdrawWorkEntrantCommand extends BountyCommandBase {
  static description = 'Cashout work entrant funds.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'Identifier for bounty to which work entry corresponds.',
    },
    {
      name: 'entryId',
      required: true,
      description: 'Identifier for work entry.',
    },
  ]

  async run() {
    const { bountyId, entryId } = this.parse(WithdrawWorkEntrantCommand).args

    const bounty = await this.getApi().bountyById(bountyId)
    await this.getApi().entryById(entryId)
    // Get member context
    const memberContext = await this.getRequiredMemberContext()

    const isFundingStage = await this.isFundingStage(bounty)
    const isFundingExpiredStage = await this.isFundingExpiredStage(bounty)
    const isWorkSubmissionStage = await this.isWorkSubmissionStage(bounty)
    const isJudgmentStage = await this.isJudgmentStage(bounty)

    // if bounty is in any of the following stages work entrant funds cannot be withdrawn
    if (isFundingStage || isFundingExpiredStage || isWorkSubmissionStage || isJudgmentStage) {
      this.error('Work entrant funds cannot be withdrawn in this stage', { exit: ExitCodes.AccessDenied })
    }

    this.jsonPrettyPrint(JSON.stringify({ memberId: memberContext.id, bountyId, entryId }))

    await this.requireConfirmation('Do you confirm the the input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(memberContext.membership.controller_account.toString()),
      'bounty',
      'withdrawWorkEntrantFunds',
      [memberContext.id, bountyId, entryId]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'WorkEntrantFundsWithdrawn')
      this.log(
        chalk.green(
          `Work entrant funds successfully cashed out for bounty with id ${chalk.cyanBright(event?.data[0].toString())}`
        )
      )
    }
  }
}
