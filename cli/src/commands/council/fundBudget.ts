import { flags } from '@oclif/command'
import chalk from 'chalk'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class FundBudget extends MembershipsCommandBase {
  static description = 'Fund council budget by some member.'
  static flags = {
    amount: flags.integer({
      required: true,
      description: 'Funding amount',
    }),
    rationale: flags.string({
      required: true,
      description: 'Reason of funding the budget',
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { amount, rationale } = this.parse(FundBudget).flags

    // Context
    const member = await this.getRequiredMemberContext()
    const keypair = await this.getDecodedPair(member.membership.controllerAccount)

    this.jsonPrettyPrint(JSON.stringify({ amount, rationale }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'council', 'fundCouncilBudget', [
      member.id,
      amount,
      rationale,
    ])

    const councilBudgetFundedEvent = this.findEvent(result, 'council', 'CouncilBudgetFunded')
    if (councilBudgetFundedEvent) {
      const [memberId, amountFunded] = councilBudgetFundedEvent.data
      this.log(
        chalk.green(
          `Member ${chalk.cyanBright(memberId.toString())} funded council budget by amount ${chalk.cyanBright(
            amountFunded.toString()
          )} !`
        )
      )
    }
  }
}
