import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'
import { validateAddress } from '../../helpers/validation'

export default class MemberRemarkCommand extends MembershipsCommandBase {
  static description = 'Member remarks'
  static args = [
    {
      name: 'message',
      required: true,
      description: 'Remark message',
    },
  ]

  static flags = {
    account: flags.string({
      description: 'Account where JOY needs to be transferred',
      dependsOn: ['amount'],
    }),
    amount: flags.string({
      description: 'JOY amount to be transferred',
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { message } = this.parse(MemberRemarkCommand).args
    let { account, amount } = this.parse(MemberRemarkCommand).flags
    const {
      id: memberId,
      membership: { controllerAccount },
    } = await this.getRequiredMemberContext(true)

    if (amount) {
      if (!account) {
        account = await this.promptForAnyAddress(`Select recipient for 'member_remark' transfer`)
      } else if (validateAddress(account) !== true) {
        this.error('Invalid recipient address', { exit: ExitCodes.InvalidInput })
      }
      await this.ensureJoyTransferIsPossible(controllerAccount.toString(), account, amount)

      await this.requireConfirmation(
        `Do you confirm transfer of ${chalk.cyan(formatBalance(amount))} to ${chalk.cyan(account)}?`
      )
    }

    const keypair = await this.getDecodedPair(controllerAccount)
    const result = await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [
      memberId,
      message,
      account && amount ? [account, amount] : null,
    ])

    const [id, msg, payment] = this.getEvent(result, 'members', 'MemberRemarked').data
    this.log(
      chalk.green(
        `Member ${id} remarked successfully with message: ${msg} ${
          payment.isSome ? `and payment: ${payment.unwrap()}` : ''
        }`
      )
    )
  }
}
