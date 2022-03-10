import AccountsCommandBase, { ISelectedMember } from '../../base/AccountsCommandBase'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'

export default class AccountChooseMember extends AccountsCommandBase {
  static description = 'Choose default member to use in the CLI'
  static flags = {
    memberId: flags.string({
      description: 'Select member (if available)',
      char: 'm',
      required: false,
    }),
  }

  async run() {
    const { memberId } = this.parse(AccountChooseMember).flags

    const memberData = memberId
      ? await this.selectKnownMember(memberId)
      : await this.getRequiredMemberContext(undefined, false)

    await this.setSelectedMember(memberData)

    this.log(
      chalk.greenBright(
        `\nMember to id ${chalk.magentaBright(
          memberData[0]
        )} (account: ${memberData[1].controller_account.toString()})!`
      )
    )
  }

  async selectKnownMember(memberIdString: string): Promise<ISelectedMember> {
    const memberId = this.createType('MemberId', memberIdString)
    const member = await this.getApi().membershipById(memberId)

    if (!member) {
      this.error(`Selected member id not found among known members!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    const selectedMember = [memberId, member] as ISelectedMember

    if (!this.isKeyAvailable(member.controller_account)) {
      this.error(`Selected member's account is not imported to CLI!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    return selectedMember
  }
}
