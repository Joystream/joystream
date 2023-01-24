import { flags } from '@oclif/command'
import chalk from 'chalk'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

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
    const { account, amount } = this.parse(MemberRemarkCommand).flags
    const [memberId, controllerAccount, payment] = await this.getValidatedMemberRemarkParams(
      amount ? { account, amount } : undefined
    )

    const keypair = await this.getDecodedPair(controllerAccount)
    const result = await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [memberId, message, payment])

    const [id, msg, optionalPayment] = this.getEvent(result, 'members', 'MemberRemarked').data
    this.log(
      chalk.green(
        `Member ${id} remarked successfully with message: ${msg} ${
          optionalPayment.isSome ? `and payment: ${optionalPayment.unwrap()}` : ''
        }`
      )
    )
  }
}
