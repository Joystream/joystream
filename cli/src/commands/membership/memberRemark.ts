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
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { message } = this.parse(MemberRemarkCommand).args
    const { id: memberId, membership } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(membership.controllerAccount)

    await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [memberId, message])

    this.log(chalk.green(`Member remarked successfully`))
  }
}
