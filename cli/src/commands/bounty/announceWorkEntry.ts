import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'

export default class AnnounceWorkEntryCommand extends BountyCommandBase {
  static description = 'Announce work entry for a bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID for the bounty',
    },
  ]

  async run() {
    const { bountyId } = this.parse(AnnounceWorkEntryCommand).args

    const bounty = await this.getApi().bountyById(bountyId)
    const memberContext = await this.getRequiredMemberContext()
    // TODO: check if the function properly ensures
    // TODO: staking requirements for this usecase
    const stakingAccount = await this.promptForStakingAccount(
      bounty.creation_params.entrant_stake,
      memberContext.id,
      memberContext.membership
    )

    if (bounty.creation_params.contract_type.isOfType('Closed')) {
      const isMemberAllowedToToWork = Array.from(bounty.creation_params.contract_type.asType('Closed')).includes(
        memberContext.id
      )
      if (!isMemberAllowedToToWork) {
        this.error('Member is not allowed to work in this Closed bounty', { exit: ExitCodes.ApiError })
      }
    }

    const canWorkEntryBeAnnounced = await this.isWorkSubmissionStage(bounty)
    if (!canWorkEntryBeAnnounced) {
      this.error('Work entry cannot be announced in this stage', { exit: ExitCodes.ApiError })
    }

    this.jsonPrettyPrint(JSON.stringify({ memberId: memberContext.id, bountyId, stakingAccount }))

    await this.requireConfirmation('Do you confirm the the input?', true)

    const result = await this.sendAndFollowNamedTx(
      await this.getDecodedPair(memberContext.membership.controller_account.toString()),
      'bounty',
      'announceWorkEntry',
      [memberContext.id, bountyId, stakingAccount]
    )
    if (result) {
      const event = this.findEvent(result, 'bounty', 'WorkEntryAnnounced')
      this.log(
        chalk.green(
          `Work entry with id ${chalk.cyanBright(event?.data[1].toString())} for Bounty with id ${chalk.cyanBright(
            event?.data[0].toString()
          )} successfully created!`
        )
      )
    }
  }
}
