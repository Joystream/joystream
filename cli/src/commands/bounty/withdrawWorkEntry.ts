import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'

export default class AnnounceWorkEntryCommand extends BountyCommandBase {
  static description = 'Withdraw work entry from a bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'Identifier for bounty from which to withdraw work entry.',
    },
    {
      name: 'entryId',
      required: true,
      description: 'Identifier for work entry.',
    },
  ]

  async run() {
    const { bountyId, entryId } = this.parse(AnnounceWorkEntryCommand).args

    const bounty = await this.getApi().bountyById(bountyId)
    await this.getApi().entryById(entryId)
    const memberContext = await this.getRequiredMemberContext()
    const canWorkEntryBeAnnounced = await this.isWorkSubmissionStage(bounty)

    if (!canWorkEntryBeAnnounced) {
      this.error('Work entry cannot be withdrawn in this stage', { exit: ExitCodes.ApiError })
    }

    this.jsonPrettyPrint(JSON.stringify({ memberId: memberContext.id, bountyId, entryId }))

    await this.requireConfirmation('Do you confirm the the input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(memberContext.membership.controller_account.toString()),
      'bounty',
      'withdrawWorkEntry',
      [memberContext.id, bountyId, entryId]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'WorkEntryWithdrawn')
      this.log(
        chalk.green(`Work entry with id ${chalk.cyanBright(event?.data[1].toString())}  successfully withdrawn!`)
      )
    }
  }
}
