import BN from 'bn.js'
import chalk from 'chalk'
import BountyCommandBase from '../../base/BountyCommandBase'
import ExitCodes from '../../ExitCodes'
import { checkBalance, isValidBalance } from '../../helpers/validation'

export default class FundBountyCommand extends BountyCommandBase {
  static description = 'Provide funding to bounty.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of the Bounty to fund',
    },
    {
      name: 'amount',
      required: true,
      description: 'Amount to be contributed towards bounty by funder',
    },
  ]

  static flags = {
    funderContext: BountyCommandBase.bountyActorContextFlag,
  }

  async run() {
    let { funderContext } = this.parse(FundBountyCommand).flags
    const { bountyId, amount } = this.parse(FundBountyCommand).args

    // Context
    if (!funderContext) {
      funderContext = await this.promptForCreatorContext()
    }

    const [funder, funderAddress] = await this.getBountyActor(funderContext)
    const bounty = await this.getApi().bountyById(bountyId)
    const funderBalance = (await this.getApi().getAccountSummary(funderAddress)).balances
    const amountBN = new BN(amount)

    if (!isValidBalance(amount) || amountBN < this.getOriginalApi().consts.bounty.minFundingLimit.toBn()) {
      this.error('Funding input is invalid or less than the minimum funding limit', { exit: ExitCodes.InvalidInput })
    }

    checkBalance(funderBalance, amountBN)
    if (await this.fundingPeriodExpired(bounty)) {
      this.error('Funding period expired', { exit: ExitCodes.ApiError })
    }

    this.jsonPrettyPrint(JSON.stringify({ bountyId, amount }))

    await this.requireConfirmation('Do you confirm the the input?', true)

    const result = await this.sendAndFollowNamedTx(await this.getDecodedPair(funderAddress), 'bounty', 'fundBounty', [
      funder,
      bountyId,
      amount,
    ])
    if (result) {
      const event = this.findEvent(result, 'bounty', 'BountyCanceled')
      this.log(chalk.green(`Bounty with id ${chalk.cyanBright(event?.data[1].toString())} successfully funded!`))
    }
  }
}
